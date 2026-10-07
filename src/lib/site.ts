/** Absolute site URL without a trailing slash, e.g. https://www.ymtextiles.com */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  // Ignore an unset or placeholder value and fall back to the domain Vercel serves in production.
  if (configured && /^https?:\/\/[^\s]+$/.test(configured) && !configured.includes("REPLACE")) {
    return configured.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
