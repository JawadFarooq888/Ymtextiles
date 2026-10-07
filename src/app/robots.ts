import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or per-customer pages that should never appear in search results.
        disallow: ["/admin", "/api/", "/basket", "/checkout/", "/order/", "/search"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
