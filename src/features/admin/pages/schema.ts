import { z } from "zod";
import { intFromString, optionalText, slugSchema } from "@/features/admin/zod-helpers";

export const pageSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Required").max(120),
  slug: slugSchema,
  body: z.string().max(20000, "This page is too long"),
  metaDescription: optionalText(160),
  isPublished: z.boolean(),
  sortOrder: intFromString(0, 999),
});

export type PageFormValues = z.input<typeof pageSchema>;
