import { z } from "zod";

/** Size chart stored as column names + rows of inch values (one per column). */
export const chartColumnsSchema = z.array(z.string().trim().min(1).max(30)).max(8);
export const chartRowsSchema = z.array(
  z.object({
    size: z.string().trim().min(1).max(30),
    values: z.array(z.number().min(0).max(200).nullable()),
  }),
);

export interface SizeChartData {
  columns: string[];
  rows: { size: string; values: (number | null)[] }[];
}

export const DEFAULT_JEANS_COLUMNS = ["Waist", "Hip", "Inside leg", "Front rise", "Leg opening"];

/** Parse a stored chart; returns null when it is empty or in an old format. */
export function parseSizeChart(columns: unknown, rows: unknown): SizeChartData | null {
  const c = chartColumnsSchema.safeParse(columns);
  const r = chartRowsSchema.safeParse(rows);
  if (!c.success || !r.success || !c.data.length || !r.data.length) return null;
  return { columns: c.data, rows: r.data };
}
