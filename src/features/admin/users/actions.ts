"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/guard";
import {
  changeOwnPasswordSchema,
  changeRoleSchema,
  createUserSchema,
  resetPasswordSchema,
} from "@/features/admin/users/schema";
import {
  changeOwnPassword,
  changeRole,
  createStaff,
  removeStaff,
  resetPassword,
} from "@/features/admin/users/service";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";
import { idSchema } from "@/features/admin/zod-helpers";

// Managing logins is limited to full admins.
const ADMIN_ONLY = ["ADMIN"] as const;

export async function createStaffAction(input: unknown): Promise<ActionResult> {
  await requireAdmin(ADMIN_ONLY);
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await createStaff(parsed.data);
    revalidatePath("/admin/users");
    return ok();
  } catch (error) {
    return fromUnknownError(error, "createStaff");
  }
}

export async function changeRoleAction(input: unknown): Promise<ActionResult> {
  const me = await requireAdmin(ADMIN_ONLY);
  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await changeRole(me.id, parsed.data.id, parsed.data.role);
    revalidatePath("/admin/users");
    return ok();
  } catch (error) {
    return fromUnknownError(error, "changeRole");
  }
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  await requireAdmin(ADMIN_ONLY);
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await resetPassword(parsed.data.id, parsed.data.password);
    return ok();
  } catch (error) {
    return fromUnknownError(error, "resetPassword");
  }
}

export async function removeStaffAction(id: unknown): Promise<ActionResult> {
  const me = await requireAdmin(ADMIN_ONLY);
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid user");
  try {
    await removeStaff(me.id, parsed.data);
    revalidatePath("/admin/users");
    return ok();
  } catch (error) {
    return fromUnknownError(error, "removeStaff");
  }
}

/** Any signed-in admin or staff member can change their own password. */
export async function changeOwnPasswordAction(input: unknown): Promise<ActionResult> {
  const me = await requireAdmin();
  const parsed = changeOwnPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await changeOwnPassword(me.id, parsed.data.current, parsed.data.password);
    return ok();
  } catch (error) {
    return fromUnknownError(error, "changeOwnPassword");
  }
}
