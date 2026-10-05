import "server-only";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { UserError } from "@/features/admin/action-result";

const STAFF_ROLES: Role[] = ["ADMIN", "STAFF"];

export function listStaff() {
  return db.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

export async function createStaff(input: {
  name: string;
  email: string;
  role: Role;
  password: string;
}) {
  const existing = await db.user.findUnique({
    where: { email: input.email },
    select: { role: true },
  });
  if (existing && STAFF_ROLES.includes(existing.role)) {
    throw new UserError("Someone with this email can already sign in.");
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  return db.user.upsert({
    where: { email: input.email },
    update: { name: input.name, role: input.role, passwordHash },
    create: { email: input.email, name: input.name, role: input.role, passwordHash },
  });
}

async function adminCount() {
  return db.user.count({ where: { role: "ADMIN" } });
}

export async function changeRole(actorId: string, id: string, role: Role) {
  if (actorId === id) throw new UserError("You cannot change your own role.");
  const user = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!user || !STAFF_ROLES.includes(user.role)) throw new UserError("User not found.");
  if (user.role === "ADMIN" && role !== "ADMIN" && (await adminCount()) <= 1) {
    throw new UserError("There must always be at least one admin.");
  }
  await db.user.update({ where: { id }, data: { role } });
}

export async function resetPassword(id: string, password: string) {
  const user = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!user || !STAFF_ROLES.includes(user.role)) throw new UserError("User not found.");
  await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
}

export async function removeStaff(actorId: string, id: string) {
  if (actorId === id) throw new UserError("You cannot remove your own account.");
  const user = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!user || !STAFF_ROLES.includes(user.role)) return;
  if (user.role === "ADMIN" && (await adminCount()) <= 1) {
    throw new UserError("There must always be at least one admin.");
  }
  // Their past orders are kept (orders link to users with ON DELETE SET NULL).
  await db.user.delete({ where: { id } });
}

export async function changeOwnPassword(userId: string, current: string, password: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) {
    throw new UserError("Your current password is not correct.");
  }
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });
}
