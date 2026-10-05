import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import type { CatalogIndex, NavCategory } from "@/features/catalog/types";

/**
 * The whole active catalogue in one cached query. Collection filtering, sorting
 * and pagination run in memory on this, which is fast for a few thousand products
 * and means a single revalidateTag refreshes every listing after an admin edit.
 */
export const getCatalogIndex = unstable_cache(
  async (): Promise<CatalogIndex> => {
    const [products, sizes, colours] = await Promise.all([
      db.product.findMany({
        where: { isActive: true, category: { isActive: true } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          sku: true,
          categoryId: true,
          fabric: true,
          pieces: true,
          type: true,
          basePrice: true,
          salePrice: true,
          isNew: true,
          isBestSeller: true,
          isFeatured: true,
          tags: true,
          createdAt: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 2,
            select: { url: true, alt: true },
          },
          variants: {
            where: { isActive: true },
            select: { sizeId: true, colourId: true, stock: true },
          },
        },
      }),
      db.size.findMany({ orderBy: { sortOrder: "asc" } }),
      db.colour.findMany({ orderBy: { name: "asc" } }),
    ]);

    return {
      products: products.map((p) => ({
        ...p,
        price: p.salePrice ?? p.basePrice,
        createdAt: p.createdAt.toISOString(),
        variants: p.variants.map((v): [string, string, number] => [v.sizeId, v.colourId, v.stock]),
        inStock: p.variants.some((v) => v.stock > 0),
      })),
      sizes,
      colours,
    };
  },
  ["catalog-index"],
  { tags: [TAGS.catalog, TAGS.attributes, TAGS.categories] },
);

/** Active categories as a tree (roots with children), in menu order. */
export const getCategoryTree = unstable_cache(
  async (): Promise<NavCategory[]> => {
    const rows = await db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, image: true, description: true, parentId: true },
    });
    const nodes = new Map<string, NavCategory>(rows.map((r) => [r.id, { ...r, children: [] }]));
    const roots: NavCategory[] = [];
    for (const node of nodes.values()) {
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      if (parent) parent.children.push(node);
      else if (!node.parentId) roots.push(node);
    }
    return roots;
  },
  ["category-tree"],
  { tags: [TAGS.categories] },
);

export const getActiveBanners = unstable_cache(
  async () =>
    db.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        image: true,
        ctaText: true,
        ctaUrl: true,
        placement: true,
      },
    }),
  ["active-banners"],
  { tags: [TAGS.banners] },
);

/** Public product detail. Cached and revalidated by tag when the admin edits the product. */
export function getProductBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const product = await db.product.findFirst({
        where: { slug, isActive: true, category: { isActive: true } },
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          description: true,
          careDetails: true,
          fabric: true,
          pieces: true,
          type: true,
          basePrice: true,
          salePrice: true,
          categoryId: true,
          seoTitle: true,
          seoDescription: true,
          tags: true,
          category: {
            select: { name: true, slug: true, parent: { select: { name: true, slug: true } } },
          },
          images: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, url: true, alt: true, colourId: true },
          },
          variants: {
            where: { isActive: true },
            orderBy: [{ size: { sortOrder: "asc" } }, { colour: { name: "asc" } }],
            select: {
              id: true,
              sku: true,
              stock: true,
              priceOverride: true,
              size: { select: { id: true, label: true, sortOrder: true } },
              colour: { select: { id: true, name: true, hex: true } },
            },
          },
          sizeChart: { select: { name: true, rows: true, notes: true } },
        },
      });
      return product;
    },
    ["product-by-slug", slug],
    { tags: [TAGS.catalog, TAGS.product(slug)] },
  )();
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/**
 * Full-text search over name, fabric, tags and description, with prefix matching
 * so partial words ("embro") work. Returns product ids ranked by relevance.
 */
export async function searchProductIds(query: string): Promise<string[]> {
  const terms = query
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 8);
  if (!terms.length) return [];
  const tsquery = terms.map((t) => `${t}:*`).join(" & ");

  const rows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT p.id
    FROM "Product" p
    JOIN "Category" c ON c.id = p."categoryId"
    CROSS JOIN to_tsquery('english', ${tsquery}) q
    CROSS JOIN LATERAL (
      SELECT
        setweight(to_tsvector('english', p.name), 'A') ||
        setweight(to_tsvector('english', coalesce(p.fabric, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(p.tags, ' ')), 'B') ||
        setweight(to_tsvector('english', c.name), 'C') ||
        setweight(to_tsvector('english', p.description), 'D') AS doc
    ) d
    WHERE p."isActive" AND c."isActive" AND d.doc @@ q
    ORDER BY ts_rank(d.doc, q) DESC, p."createdAt" DESC
    LIMIT 96
  `);
  return rows.map((r) => r.id);
}
