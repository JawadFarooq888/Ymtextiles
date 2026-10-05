"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/guard";
import { deleteSubscriber, setUnsubscribed } from "@/features/admin/newsletter/service";
import { fail, fromUnknownError, ok, type ActionResult } from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

const toggleSchema = z.object({ id: idSchema, unsubscribed: z.boolean() });

export async function setUnsubscribedAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid request");
  try {
    await setUnsubscribed(parsed.data.id, parsed.data.unsubscribed);
    revalidatePath("/admin/newsletter");
    return ok();
  } catch (error) {
    return fromUnknownError(error, "setUnsubscribed");
  }
}

/** Permanently remove someone (e.g. a UK GDPR erasure request). */
export async function deleteSubscriberAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid subscriber");
  try {
    await deleteSubscriber(parsed.data);
    revalidatePath("/admin/newsletter");
    return ok();
  } catch (error) {
    return fromUnknownError(error, "deleteSubscriber");
  }
}
