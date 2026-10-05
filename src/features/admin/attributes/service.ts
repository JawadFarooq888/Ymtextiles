import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import { UserError } from "@/features/admin/action-result";
import type { colourSchema, sizeSchema } from "@/features/admin/attributes/schema";

export function listSizes() {
  return db.size.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { variants: true } } },
  });
}

export function listColours() {
  return db.colour.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { variants: true } } },
  });
}

export async function saveSize({ id, ...data }: z.output<typeof sizeSchema>) {
  return id ? db.size.update({ where: { id }, data }) : db.size.create({ data });
}

export async function saveColour({ id, ...data }: z.output<typeof colourSchema>) {
  return id ? db.colour.update({ where: { id }, data }) : db.colour.create({ data });
}

export async function deleteSize(id: string) {
  const used = await db.variant.count({ where: { sizeId: id } });
  if (used > 0) throw new UserError(`This size is used by ${used} variant(s). Remove them first.`);
  await db.size.delete({ where: { id } });
}

export async function deleteColour(id: string) {
  const used = await db.variant.count({ where: { colourId: id } });
  if (used > 0)
    throw new UserError(`This colour is used by ${used} variant(s). Remove them first.`);
  await db.colour.delete({ where: { id } });
}
