import { z } from "zod";
import { intFromString, optionalText, optionalUrl, slugSchema } from "@/features/admin/zod-helpers";

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Required").max(80),
  slug: slugSchema,
  parentId: z.string().transform((v) => (v === "" ? null : v)),
  description: optionalText(1000),
  image: optionalUrl,
  sortOrder: intFromString(0, 9999),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.input<typeof categorySchema>;
export type CategoryData = z.output<typeof categorySchema>;
