import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";

/** Cached loader for the single Settings row. Revalidated by tag when the admin saves settings. */
export const getSettings = unstable_cache(
  async () => {
    const settings = await db.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      throw new Error("Settings row missing. Run `npm run db:seed`.");
    }
    return settings;
  },
  ["settings"],
  { tags: [TAGS.settings] },
);
