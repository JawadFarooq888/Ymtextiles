import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import { UserError } from "@/features/admin/action-result";
import { SYSTEM_PAGE_SLUGS } from "@/features/content/defaults";
import type { pageSchema } from "@/features/admin/pages/schema";

export function listPages() {
  return db.page.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
}

export function getPageForEdit(id: string) {
  return db.page.findUnique({ where: { id } });
}

/** Built-in pages keep their address because the footer, emails and checkout link to them. */
export async function savePage({ id, ...data }: z.output<typeof pageSchema>) {
  if (id) {
    const existing = await db.page.findUnique({ where: { id }, select: { slug: true } });
    if (!existing) throw new UserError("This page no longer exists.");
    if (SYSTEM_PAGE_SLUGS.has(existing.slug) && existing.slug !== data.slug) {
      throw new UserError("The address of a built-in page cannot be changed.");
    }
    const page = await db.page.update({ where: { id }, data });
    return { page, previousSlug: existing.slug };
  }
  const page = await db.page.create({ data });
  return { page, previousSlug: null };
}

export async function deletePage(id: string) {
  const page = await db.page.findUnique({ where: { id }, select: { slug: true } });
  if (!page) return null;
  if (SYSTEM_PAGE_SLUGS.has(page.slug)) {
    throw new UserError(
      "Built-in pages cannot be deleted. Switch off 'Published' to hide it instead.",
    );
  }
  await db.page.delete({ where: { id } });
  return page.slug;
}
