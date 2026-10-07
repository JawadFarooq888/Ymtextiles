"use server";

import { newsletterSchema } from "@/features/newsletter/schema";
import { subscribe } from "@/features/newsletter/service";
import { checkRateLimit } from "@/lib/rate-limit";

export type NewsletterState = { ok?: boolean; error?: string } | undefined;

export async function subscribeAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    consent: formData.get("consent") === "on",
    source: formData.get("source") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check your details" };
  if (!(await checkRateLimit("newsletter", 5, "10 m"))) {
    return { error: "Too many sign-ups from this connection. Please try again later." };
  }
  try {
    await subscribe(parsed.data.email, parsed.data.source);
    return { ok: true };
  } catch (error) {
    console.error("Newsletter subscribe failed", error);
    return { error: "Sorry, something went wrong. Please try again." };
  }
}
