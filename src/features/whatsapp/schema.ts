import { z } from "zod";
import { basketLineSchema, basketLinesSchema } from "@/features/basket/schema";
import { phoneSchema, ukPostcodeSchema } from "@/lib/uk";

export const productWhatsAppOrderSchema = basketLineSchema;

/** Shared by the basket WhatsApp form (client) and the server action. */
export const whatsappCustomerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: phoneSchema,
  postcode: ukPostcodeSchema,
  note: z
    .string()
    .trim()
    .max(300, "Please keep the note under 300 characters")
    .transform((v) => (v === "" ? null : v)),
});

export type WhatsAppCustomerFormValues = z.input<typeof whatsappCustomerSchema>;

export const basketWhatsAppOrderSchema = whatsappCustomerSchema.extend({
  lines: basketLinesSchema,
});
