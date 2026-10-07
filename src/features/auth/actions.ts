"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  // Slows down password guessing: 10 attempts per 15 minutes per IP.
  if (!(await checkRateLimit("admin-login", 10, "15 m"))) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    // signIn throws a redirect on success; let Next.js handle it.
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
