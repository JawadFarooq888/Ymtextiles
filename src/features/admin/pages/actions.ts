"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import { pageSchema } from "@/features/admin/pages/schema";
import { deletePage, savePage } from "@/features/admin/pages/service";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

function refresh(...slugs: (string | null)[]) {
  revalidateTag(TAGS.pages);
  for (const slug of slugs) if (slug) revalidatePath(`/pages/${slug}`);
  revalidatePath("/admin/pages");
}

export async function savePageAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    const { page, previousSlug } = await savePage(parsed.data);
    refresh(page.slug, previousSlug);
    return ok({ id: page.id });
  } catch (error) {
    return fromUnknownError(error, "savePage");
  }
}

export async function deletePageAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid page");
  try {
    const slug = await deletePage(parsed.data);
    refresh(slug);
    return ok();
  } catch (error) {
    return fromUnknownError(error, "deletePage");
  }
}
