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
  whatsappUkOnly: z.boolean(),
  dispatchInfo: optionalText(200),
  footerTagline: z.string().trim().min(1, "Required").max(200),
  seoTitle: z.string().trim().min(1, "Required").max(70, "Keep it under 70 characters"),
  seoDescription: z.string().trim().min(1, "Required").max(160, "Keep it under 160 characters"),
  menuShowNewIn: z.boolean(),
  menuShowLawn: z.boolean(),
  menuShowSale: z.boolean(),
  whyUs: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Required").max(40),
        text: z.string().trim().min(1, "Required").max(140),
      }),
    )
    .length(4),
});

export type SettingsFormValues = z.input<typeof settingsSchema>;
