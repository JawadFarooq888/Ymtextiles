"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import { colourSchema, sizeSchema } from "@/features/admin/attributes/schema";
import {
  deleteColour,
  deleteSize,
  saveColour,
  saveSize,
} from "@/features/admin/attributes/service";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

function refresh() {
  revalidateTag(TAGS.attributes);
  revalidateTag(TAGS.catalog);
  revalidatePath("/admin/attributes");
}

export async function saveSizeAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = sizeSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await saveSize(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "saveSize");
  }
}

export async function deleteSizeAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid size");
  try {
    await deleteSize(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "deleteSize");
  }
}

export async function saveColourAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = colourSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await saveColour(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "saveColour");
  }
}

export async function deleteColourAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid colour");
  try {
    await deleteColour(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "deleteColour");
  }
}
