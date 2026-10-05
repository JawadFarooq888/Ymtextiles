"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import { settingsSchema } from "@/features/admin/settings/schema";
import { saveSettings } from "@/features/admin/settings/service";
import {
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  // Only full admins (not staff) may change business settings.
  await requireAdmin(["ADMIN"]);
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await saveSettings(parsed.data);
    revalidateTag(TAGS.settings);
    revalidatePath("/", "layout");
    return ok();
  } catch (error) {
    return fromUnknownError(error, "saveSettings");
  }
}
