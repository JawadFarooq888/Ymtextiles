import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import type { bannerSchema } from "@/features/admin/banners/schema";

export function listBanners() {
  return db.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] });
}

export async function saveBanner({ id, ...data }: z.output<typeof bannerSchema>) {
  return id ? db.banner.update({ where: { id }, data }) : db.banner.create({ data });
}

export async function deleteBanner(id: string) {
  await db.banner.delete({ where: { id } });
}
