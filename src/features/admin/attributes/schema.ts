import { z } from "zod";
import { intFromString } from "@/features/admin/zod-helpers";

const optionalInches = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 10 || n > 60) {
      ctx.addIssue({ code: "custom", message: "Whole inches between 10 and 60" });
      return z.NEVER;
    }
    return n;
  });

/** Jeans sizes have a waist and a length (inches); other sizes (e.g. kids "7-8Y") leave both empty. */
export const sizeSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().trim().min(1, "Required").max(30),
    waist: optionalInches,
    length: optionalInches,
    sortOrder: intFromString(0, 9999),
  })
  .refine((s) => (s.waist === null) === (s.length === null), {
    path: ["length"],
    message: "Fill in both waist and length, or leave both empty",
  });

/** Default label and sort order for a waist/length size, e.g. W32 L30 sorts after W32 L28. */
export function jeansSizeLabel(waist: number, length: number) {
  return `W${waist} L${length}`;
}
export function jeansSizeSortOrder(waist: number, length: number) {
  return waist * 100 + length;
}

export const colourSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Required").max(40),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #1F4D3F")
    .transform((v) => v.toUpperCase()),
});

export type SizeFormValues = z.input<typeof sizeSchema>;
export type ColourFormValues = z.input<typeof colourSchema>;
