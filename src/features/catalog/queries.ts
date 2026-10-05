import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";

/** Public product detail. Cached and revalidated by tag when the admin edits the product. */
export function getProductBySlug(slug: string) {
  return unstable_cache(
    () =>
      db.product.findFirst({
        where: { slug, isActive: true, category: { isActive: true } },
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" } },
          variants: {
            where: { isActive: true },
            include: { size: true, colour: true },
            orderBy: [{ size: { sortOrder: "asc" } }, { colour: { name: "asc" } }],
          },
          sizeChart: true,
        },
      }),
    ["product-by-slug", slug],
    { tags: [TAGS.catalog, TAGS.product(slug)] },
  )();
}
