import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Stripe client (API version pinned by the installed SDK). Throws if not configured. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key, { appInfo: { name: "YM Textiles" }, maxNetworkRetries: 2 });
  return client;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
