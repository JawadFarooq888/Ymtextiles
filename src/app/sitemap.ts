import type { MetadataRoute } from "next";
import { VIRTUAL_COLLECTIONS } from "@/features/catalog/collections";
import { getCatalogIndex, getCategoryTree } from "@/features/catalog/queries";
import { getPageLinks } from "@/features/content/queries";
import type { NavCategory } from "@/features/catalog/types";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

function flatten(nodes: NavCategory[]): NavCategory[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const [index, tree, pages] = await Promise.all([
    getCatalogIndex(),
    getCategoryTree(),
    getPageLinks(),
  ]);
  const now = new Date();

  return [
    { url: site, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...Object.keys(VIRTUAL_COLLECTIONS).map((slug) => ({
      url: `${site}/collections/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...flatten(tree).map((c) => ({
      url: `${site}/collections/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...index.products.map((p) => ({
      url: `${site}/products/${p.slug}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: p.images.map((i) => i.url),
    })),
    ...pages.map((p) => ({
      url: `${site}/pages/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
