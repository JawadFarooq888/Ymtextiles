import { z } from "zod";
import { basketLineSchema, basketLinesSchema } from "@/features/basket/schema";
import { phoneSchema, ukPostcodeSchema } from "@/lib/uk";

export const productWhatsAppOrderSchema = basketLineSchema;

const anyLocation = z
  .string()
  .trim()
  .min(2, "Please enter your postcode or town")
  .max(60, "Please keep this under 60 characters");

/**
 * Basket WhatsApp form (client) and server action. With `ukOnly` (Admin → Settings)
 * a valid UK postcode is required; otherwise any postcode or town is accepted.
 */
export function whatsappCustomerSchema(ukOnly: boolean) {
  return z.object({
    name: z.string().trim().min(2, "Please enter your name").max(80),
    phone: phoneSchema,
    postcode: ukOnly ? ukPostcodeSchema : anyLocation,
    note: z
      .string()
      .trim()
      .max(300, "Please keep the note under 300 characters")
      .transform((v) => (v === "" ? null : v)),
  });
}

export type WhatsAppCustomerFormValues = z.input<ReturnType<typeof whatsappCustomerSchema>>;

export function basketWhatsAppOrderSchema(ukOnly: boolean) {
  return whatsappCustomerSchema(ukOnly).extend({ lines: basketLinesSchema });
}
