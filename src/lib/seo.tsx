import { getSiteUrl } from "@/lib/site";

/** Renders schema.org structured data. `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw JSON; "<" is escaped so it can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const penceToDecimal = (pence: number) => (pence / 100).toFixed(2);

export function breadcrumbJsonLd(items: { name: string; href?: string }[]) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: `${site}${item.href}` } : {}),
    })),
  };
}

export function productJsonLd(product: {
  name: string;
  slug: string;
  sku: string;
  description: string;
  brand: string;
  images: string[];
  fabric: string | null;
  variants: { sku: string; stock: number; price: number; size: string; colour: string }[];
}) {
  const url = `${getSiteUrl()}/products/${product.slug}`;
  const prices = product.variants.map((v) => v.price);
  const inStock = product.variants.some((v) => v.stock > 0);
  const availability = inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    url,
    description: product.description || undefined,
    image: product.images.length ? product.images : undefined,
    brand: { "@type": "Brand", name: product.brand },
    material: product.fabric ?? undefined,
    offers:
      prices.length > 0 && Math.min(...prices) !== Math.max(...prices)
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "GBP",
            lowPrice: penceToDecimal(Math.min(...prices)),
            highPrice: penceToDecimal(Math.max(...prices)),
            offerCount: product.variants.length,
            availability,
            url,
          }
        : {
            "@type": "Offer",
            priceCurrency: "GBP",
            price: penceToDecimal(prices[0] ?? 0),
            availability,
            itemCondition: "https://schema.org/NewCondition",
            url,
          },
  };
}

export function organizationJsonLd(settings: {
  storeName: string;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  contactEmail: string | null;
}) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: settings.storeName,
    url: site,
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    sameAs: [settings.instagramUrl, settings.tiktokUrl, settings.facebookUrl].filter(Boolean),
  };
}
