import { z } from "zod";
import { parsePoundsToPence } from "@/lib/money";

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");

/** Optional text: empty string becomes null. */
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

/** Required pounds string ("45.00") -> pence. */
export const poundsRequired = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const pence = parsePoundsToPence(v);
    if (pence === null) {
      ctx.addIssue({ code: "custom", message: "Enter a price like 45 or 45.00" });
      return z.NEVER;
    }
    return pence;
  });

/** Optional pounds string -> pence or null. */
export const poundsOptional = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const pence = parsePoundsToPence(v);
    if (pence === null) {
      ctx.addIssue({ code: "custom", message: "Enter a price like 45 or 45.00" });
      return z.NEVER;
    }
    return pence;
  });

export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), {
    message: "Use a full https:// link or a path starting with /",
  })
  .transform((v) => (v === "" ? null : v));

export const intFromString = (min: number, max: number) =>
  z.coerce.number().int("Whole numbers only").min(min).max(max);

export const idSchema = z.string().min(1).max(50);
