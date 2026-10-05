import "server-only";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Window = `${number} ${"s" | "m" | "h"}`;

const limiters = new Map<string, Ratelimit>();
let warned = false;

function getLimiter(name: string, limit: number, window: Window): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) {
      console.warn("[rate-limit] Upstash is not configured: rate limiting is disabled.");
      warned = true;
    }
    return null;
  }
  const key = `${name}:${limit}:${window}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `ym:${name}`,
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Returns true when the request is allowed. Limits are per client IP.
 * Fails open (allows) if Upstash is not configured or unreachable, so a Redis
 * outage never blocks orders.
 */
export async function checkRateLimit(
  name: string,
  limit: number,
  window: Window,
): Promise<boolean> {
  const limiter = getLimiter(name, limit, window);
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(await clientIp());
    return success;
  } catch (error) {
    console.error("[rate-limit] check failed", error);
    return true;
  }
}
