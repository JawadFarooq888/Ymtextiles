"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/guard";
import { TAGS } from "@/lib/cache-tags";
import {
  cancelOrder,
  confirmWhatsAppOrder,
  saveAdminNotes,
  setOrderStatus,
} from "@/features/orders/service";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

function refresh(id: string) {
  // Stock may have changed, so refresh the shop catalogue too.
  revalidateTag(TAGS.catalog);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export async function confirmOrderAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid order");
  try {
    await confirmWhatsAppOrder(parsed.data);
    refresh(parsed.data);
    return ok();
  } catch (error) {
    return fromUnknownError(error, "confirmOrder");
  }
}

export async function cancelOrderAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid order");
  try {
    await cancelOrder(parsed.data);
    refresh(parsed.data);
    return ok();
  } catch (error) {
    return fromUnknownError(error, "cancelOrder");
  }
}

const statusSchema = z.object({
  id: idSchema,
  status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED", "REFUNDED", "CANCELLED"]),
});

export async function setOrderStatusAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await setOrderStatus(parsed.data.id, parsed.data.status);
    refresh(parsed.data.id);
    return ok();
  } catch (error) {
    return fromUnknownError(error, "setOrderStatus");
  }
}

const notesSchema = z.object({
  id: idSchema,
  adminNotes: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => (v === "" ? null : v)),
});

export async function saveAdminNotesAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await saveAdminNotes(parsed.data.id, parsed.data.adminNotes);
    revalidatePath(`/admin/orders/${parsed.data.id}`);
    return ok();
  } catch (error) {
    return fromUnknownError(error, "saveAdminNotes");
  }
}
