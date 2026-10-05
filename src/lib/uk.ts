import { z } from "zod";

// UK postcode (incl. GIR 0AA), spaces optional.
const POSTCODE = /^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]? ?\d[ABD-HJLNP-UW-Z]{2})$/i;

/** "sw1a1aa" -> "SW1A 1AA", or null when invalid. */
export function normaliseUkPostcode(input: string): string | null {
  const compact = input.replace(/\s+/g, "").toUpperCase();
  if (!POSTCODE.test(compact)) return null;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/**
 * Phone number to international digits for WhatsApp.
 * UK numbers may be written 07..., +44 7..., 0044...; other countries need a leading + or 00.
 */
export function normalisePhone(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  let intl: string;
  if (trimmed.startsWith("+")) intl = digits;
  else if (digits.startsWith("00")) intl = digits.slice(2);
  else if (digits.startsWith("0")) intl = `44${digits.slice(1)}`;
  else intl = digits;
  if (intl.startsWith("44")) {
    return /^44\d{9,10}$/.test(intl) ? intl : null;
  }
  return /^[1-9]\d{7,14}$/.test(intl) ? intl : null;
}

export const ukPostcodeSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const pc = normaliseUkPostcode(v);
    if (!pc) {
      ctx.addIssue({ code: "custom", message: "Enter a valid UK postcode, e.g. SW1A 1AA" });
      return z.NEVER;
    }
    return pc;
  });

export const phoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const phone = normalisePhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Enter a valid mobile number, e.g. 07123 456789" });
      return z.NEVER;
    }
    return phone;
  });
