import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import type { sizeChartSchema } from "@/features/admin/size-charts/schema";

export function listSizeCharts() {
  return db.sizeChart.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export function getSizeChart(id: string) {
  return db.sizeChart.findUnique({ where: { id } });
}

export async function saveSizeChart({ id, ...data }: z.output<typeof sizeChartSchema>) {
  return id ? db.sizeChart.update({ where: { id }, data }) : db.sizeChart.create({ data });
}

export async function deleteSizeChart(id: string) {
  // Products keep working: the relation sets their sizeChartId to null.
  await db.sizeChart.delete({ where: { id } });
}
