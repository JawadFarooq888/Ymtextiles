import "server-only";
import { db } from "@/lib/db";
import { UserError } from "@/features/admin/action-result";
import type { CategoryData } from "@/features/admin/categories/schema";

export async function listCategoriesForAdmin() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });
}

export async function listCategoryOptions() {
  const all = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parentId: true },
  });
  // Parents first, each followed by its children, labelled "Parent > Child".
  const byId = new Map(all.map((c) => [c.id, c]));
  const label = (c: (typeof all)[number]): string => {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    return parent ? `${label(parent)} > ${c.name}` : c.name;
  };
  return all
    .map((c) => ({ id: c.id, label: label(c), parentId: c.parentId }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function isDescendant(candidateId: string, ancestorId: string): Promise<boolean> {
  let current = await db.category.findUnique({
    where: { id: candidateId },
    select: { parentId: true },
  });
  for (let depth = 0; current?.parentId && depth < 20; depth++) {
    if (current.parentId === ancestorId) return true;
    current = await db.category.findUnique({
      where: { id: current.parentId },
      select: { parentId: true },
    });
  }
  return false;
}

export async function saveCategory(data: CategoryData) {
  const { id, ...fields } = data;
  if (id && fields.parentId) {
    if (fields.parentId === id || (await isDescendant(fields.parentId, id))) {
      throw new UserError("A category cannot be placed inside itself.");
    }
  }
  return id
    ? db.category.update({ where: { id }, data: fields })
    : db.category.create({ data: fields });
}

export async function deleteCategory(id: string) {
  const counts = await db.category.findUnique({
    where: { id },
    select: { _count: { select: { products: true, children: true } } },
  });
  if (!counts) return;
  if (counts._count.products > 0)
    throw new UserError("Move or delete this category's products first.");
  if (counts._count.children > 0) throw new UserError("Delete or move its sub-categories first.");
  await db.category.delete({ where: { id } });
}
