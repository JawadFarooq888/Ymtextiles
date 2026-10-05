"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import { bannerSchema } from "@/features/admin/banners/schema";
import { deleteBanner, saveBanner } from "@/features/admin/banners/service";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

function refresh() {
  revalidateTag(TAGS.banners);
  revalidatePath("/admin/banners");
}

export async function saveBannerAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await saveBanner(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "saveBanner");
  }
}

export async function deleteBannerAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid banner");
  try {
    await deleteBanner(parsed.data);
    refresh();
    return ok();
  } catch (error) {
    return fromUnknownError(error, "deleteBanner");
  }
}
