import { z } from "zod";
import { intFromString, optionalText, poundsRequired } from "@/features/admin/zod-helpers";

const optionalHttpsUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\//.test(v), { message: "Use a full https:// link" })
  .transform((v) => (v === "" ? null : v));

export const settingsSchema = z.object({
  storeName: z.string().trim().min(1, "Required").max(80),
  whatsappNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s+()-]/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^[1-9]\d{9,14}$/,
          "Use international format without + or spaces, e.g. 447123456789",
        ),
    ),
  whatsappGreeting: z.string().trim().min(1, "Required").max(200),
  freeDeliveryThreshold: poundsRequired,
  standardDeliveryFee: poundsRequired,
  expressDeliveryFee: poundsRequired,
  announcementText: optionalText(200),
  contactEmail: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, { message: "Invalid email" })
    .transform((v) => (v === "" ? null : v)),
  instagramUrl: optionalHttpsUrl,
  tiktokUrl: optionalHttpsUrl,
  facebookUrl: optionalHttpsUrl,
  businessAddress: optionalText(300),
  returnsDays: intFromString(0, 365),
  lowStockThreshold: intFromString(0, 1000),
});

export type SettingsFormValues = z.input<typeof settingsSchema>;
