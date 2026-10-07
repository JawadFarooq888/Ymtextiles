import { z } from "zod";
import { optionalText } from "@/features/admin/zod-helpers";

// Measurements are entered in inches; the shop shows inches and centimetres.
const inchValue = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 200) {
      ctx.addIssue({ code: "custom", message: "Use a number in inches, e.g. 32 or 32.5" });
      return z.NEVER;
    }
    return n;
  });

export const sizeChartSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Required").max(80),
    notes: optionalText(500),
    columns: z
      .array(z.object({ name: z.string().trim().min(1, "Name the column").max(30) }))
      .min(1, "Add at least one column")
      .max(8, "Up to 8 columns"),
    rows: z
      .array(
        z.object({
          size: z.string().trim().min(1, "Required").max(30),
          values: z.array(inchValue),
        }),
      )
      .min(1, "Add at least one row")
      .max(40),
  })
  .refine((c) => c.rows.every((r) => r.values.length === c.columns.length), {
    message: "Every row needs one value per column",
    path: ["rows"],
  })
  .transform((c) => ({
    id: c.id,
    name: c.name,
    notes: c.notes,
    columns: c.columns.map((col) => col.name),
    rows: c.rows,
  }));

export type SizeChartFormValues = z.input<typeof sizeChartSchema>;
