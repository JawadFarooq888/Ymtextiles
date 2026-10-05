import { z } from "zod";
import { intFromString } from "@/features/admin/zod-helpers";

export const sizeSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Required").max(30),
  sortOrder: intFromString(0, 999),
});

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
