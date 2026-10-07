import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { SYSTEM_PAGES } from "@/features/content/defaults";

export const getSizeChartsForGuide = unstable_cache(
  async () =>
    db.sizeChart.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, columns: true, rows: true, notes: true },
    }),
  ["size-charts-guide", "v2"],
  { tags: [TAGS.catalog] },
);

export interface PublicPage {
  slug: string;
  title: string;
  body: string;
  metaDescription: string | null;
}

/** A published page by slug. Built-in pages fall back to their default text if the row is missing. */
export function getPage(slug: string): Promise<PublicPage | null> {
  return unstable_cache(
    async () => {
      const row = await db.page.findUnique({
        where: { slug },
        select: { slug: true, title: true, body: true, metaDescription: true, isPublished: true },
      });
      if (row) return row.isPublished ? row : null;
      const fallback = SYSTEM_PAGES.find((p) => p.slug === slug);
      return fallback
        ? {
            slug,
            title: fallback.title,
            body: fallback.body,
            metaDescription: fallback.metaDescription,
          }
        : null;
    },
    ["page", slug],
    { tags: [TAGS.pages] },
  )();
}

/** Published pages for footer and menu links, in admin sort order. */
export const getPageLinks = unstable_cache(
  async () => {
    const rows = await db.page.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { slug: true, title: true },
    });
    return rows.length ? rows : SYSTEM_PAGES.map((p) => ({ slug: p.slug, title: p.title }));
  },
  ["page-links"],
  { tags: [TAGS.pages] },
);
