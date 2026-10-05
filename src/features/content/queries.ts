import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";

export const getSizeChartsForGuide = unstable_cache(
  async () =>
    db.sizeChart.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, rows: true, notes: true },
    }),
  ["size-charts-guide"],
  { tags: [TAGS.catalog] },
);
