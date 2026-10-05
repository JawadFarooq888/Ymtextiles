import { z } from "zod";

const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letters and at least one number");

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  role: z.enum(["ADMIN", "STAFF"]),
  password,
});

export const resetPasswordSchema = z.object({ id: z.string().min(1), password });

export const changeRoleSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["ADMIN", "STAFF"]),
});

export const changeOwnPasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export type CreateUserValues = z.input<typeof createUserSchema>;
export type ChangeOwnPasswordValues = z.input<typeof changeOwnPasswordSchema>;
