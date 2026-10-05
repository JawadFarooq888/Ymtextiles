import { z } from "zod";

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address"))
    .pipe(z.string().max(200)),
  consent: z.literal(true, { error: "Please tick the box to agree to receive emails" }),
  source: z.string().max(40).optional(),
});
