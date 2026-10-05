"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import { categorySchema } from "@/features/admin/categories/schema";
import { deleteCategory, saveCategory } from "@/features/admin/categories/service";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

function refresh() {
  revalidateTag(TAGS.categories);
  revalidateTag(TAGS.catalog);
  revalidatePath("/admin/categories");
}

export async function saveCategoryAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await saveCategory(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "saveCategory");
  }
}

export async function deleteCategoryAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid category");
  try {
    await deleteCategory(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "deleteCategory");
  }
}
