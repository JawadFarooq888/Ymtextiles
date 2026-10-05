import { z } from "zod";
import { intFromString, optionalText, optionalUrl } from "@/features/admin/zod-helpers";

export const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Required").max(120),
  subtitle: optionalText(240),
  image: optionalUrl,
  ctaText: optionalText(40),
  ctaUrl: optionalUrl,
  placement: z.enum(["HERO", "ANNOUNCEMENT"]),
  isActive: z.boolean(),
  sortOrder: intFromString(0, 999),
});

export type BannerFormValues = z.input<typeof bannerSchema>;
