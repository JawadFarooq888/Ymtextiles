"use server";

import { basketLinesSchema } from "@/features/basket/schema";
import { createCheckoutSession } from "@/features/checkout/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { isStripeConfigured } from "@/lib/stripe";
import { fail, fromUnknownError, ok, type ActionResult } from "@/features/admin/action-result";

export async function startCheckoutAction(lines: unknown): Promise<ActionResult<{ url: string }>> {
  const parsed = basketLinesSchema.safeParse(lines);
  if (!parsed.success) return fail("Your basket is empty");
  if (!isStripeConfigured())
    return fail("Card payment is not available yet. Please order on WhatsApp.");
  if (!(await checkRateLimit("checkout", 20, "10 m"))) {
    return fail("Too many attempts. Please wait a minute and try again.");
  }
  try {
    return ok({ url: await createCheckoutSession(parsed.data) });
  } catch (error) {
    return fromUnknownError(error, "startCheckout");
  }
}
