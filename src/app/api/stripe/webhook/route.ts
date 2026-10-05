import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { TAGS } from "@/lib/cache-tags";
import { handleCheckoutAbandoned, handleCheckoutPaid } from "@/features/checkout/service";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Configure in the Stripe dashboard for:
 * checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, checkout.session.expired
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // The raw body is required for signature verification.
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("[stripe] webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const result = await handleCheckoutPaid(event.data.object);
        if (result === "updated") {
          revalidateTag(TAGS.catalog); // stock changed
          revalidatePath("/admin", "layout");
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await handleCheckoutAbandoned(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    // A 500 makes Stripe retry later; handlers are idempotent so retries are safe.
    console.error(`[stripe] webhook ${event.type} failed`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
