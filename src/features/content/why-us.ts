import { z } from "zod";
import { DEFAULT_WHY_US } from "@/features/content/defaults";

const whyUsSchema = z
  .array(z.object({ title: z.string().min(1), text: z.string().min(1) }))
  .length(4);

/** The 4 "Why YM Textiles" points from Settings, or the defaults. */
export function parseWhyUs(value: unknown): { title: string; text: string }[] {
  const parsed = whyUsSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_WHY_US;
}
