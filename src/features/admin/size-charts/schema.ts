import { z } from "zod";
import { optionalText } from "@/features/admin/zod-helpers";

// Measurements are entered in inches; the shop shows inches and cm.
const inches = z.coerce.number().min(0).max(100);

export const sizeChartRowSchema = z.object({
  size: z.string().trim().min(1, "Required").max(30),
  chest: inches,
  length: inches,
  sleeve: inches,
  trouserLength: inches,
});

export const sizeChartSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Required").max(80),
  notes: optionalText(500),
  rows: z.array(sizeChartRowSchema).min(1, "Add at least one row").max(20),
});

export type SizeChartRow = z.output<typeof sizeChartRowSchema>;
export type SizeChartFormValues = z.input<typeof sizeChartSchema>;
