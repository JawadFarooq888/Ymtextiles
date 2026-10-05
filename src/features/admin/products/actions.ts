"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import { productSchema } from "@/features/admin/products/schema";
import { deleteProduct, saveProduct } from "@/features/admin/products/service";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

function refresh(...slugs: (string | null)[]) {
  revalidateTag(TAGS.catalog);
  for (const slug of slugs) if (slug) revalidateTag(TAGS.product(slug));
  revalidatePath("/admin/products");
}

export async function saveProductAction(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    const saved = await saveProduct(parsed.data);
    refresh(saved.slug, saved.previousSlug);
    return ok({ id: saved.id, slug: saved.slug });
  } catch (error) {
    return fromUnknownError(error, "saveProduct");
  }
}

export async function deleteProductAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid product");
  try {
    const slug = await deleteProduct(parsed.data);
    refresh(slug);
    return ok();
  } catch (error) {
    return fromUnknownError(error, "deleteProduct");
  }
}
