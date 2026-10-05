import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";
import { UserError } from "@/features/admin/action-result";
import { quoteBasket, type BasketRequestLine } from "@/features/basket/service";
import { deliveryFee } from "@/features/basket/pricing";
import { createOrder, deductStock } from "@/features/orders/service";
import { sendNewOrderEmails } from "@/features/orders/notifications";

/**
 * Re-price the basket from the database, create a PENDING website order and a
 * Stripe Checkout Session for it. Returns the Stripe-hosted payment page URL.
 */
export async function createCheckoutSession(lines: BasketRequestLine[]): Promise<string> {
  const settings = await getSettings();
  const quote = await quoteBasket(lines, settings, "standard");
  if (!quote.ok) {
    throw new UserError("Some items in your basket have changed. Please review your basket.");
  }

  const order = await createOrder({ channel: "WEBSITE", status: "PENDING", quote });
  const siteUrl = getSiteUrl();
  const standardFee = deliveryFee(quote.subtotal, settings, "standard");

  // No delivery-time estimates until the owner confirms dispatch times (see DECISIONS.md).
  const shippingOption = (
    name: string,
    amount: number,
    method: "standard" | "express",
  ): Stripe.Checkout.SessionCreateParams.ShippingOption => ({
    shipping_rate_data: {
      type: "fixed_amount",
      display_name: name,
      fixed_amount: { amount, currency: "gbp" },
      tax_behavior: "inclusive",
      metadata: { method },
    },
  });

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      currency: "gbp",
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.orderNumber } },
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "gbp",
          unit_amount: item.unitPrice,
          tax_behavior: "inclusive",
          product_data: {
            name: item.productName,
            description: `Size ${item.size} · ${item.colour} · SKU ${item.sku}`,
            metadata: { variantId: item.variantId ?? "", sku: item.sku },
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ["GB"] },
      phone_number_collection: { enabled: true },
      shipping_options: [
        shippingOption(
          standardFee === 0 ? "UK standard delivery (free)" : "UK standard delivery",
          standardFee,
          "standard",
        ),
        shippingOption("UK express delivery", settings.expressDeliveryFee, "express"),
      ],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/basket?cancelled=1`,
      // Short expiry so abandoned checkouts release quickly (Stripe minimum is 30 minutes).
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });
    await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return session.url;
  } catch (error) {
    // Don't leave an orphaned pending order if Stripe rejected the session.
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        adminNotes: "Stripe session could not be created.",
      },
    });
    throw error;
  }
}

function addressFrom(session: Stripe.Checkout.Session) {
  const shipping = session.collected_information?.shipping_details;
  const address = shipping?.address ?? session.customer_details?.address ?? null;
  return {
    customerName: shipping?.name ?? session.customer_details?.name ?? null,
    addressLine1: address?.line1 ?? null,
    addressLine2: address?.line2 ?? null,
    city: address?.city ?? null,
    postcode: address?.postal_code ?? null,
    country: address?.country ?? "GB",
  };
}

/**
 * checkout.session.completed / async_payment_succeeded: mark the order PAID,
 * reduce stock and send emails. Idempotent: only the first delivery of the event
 * changes the order; repeats are ignored.
 */
export async function handleCheckoutPaid(
  session: Stripe.Checkout.Session,
): Promise<"updated" | "ignored"> {
  if (session.payment_status !== "paid") return "ignored";
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return "ignored";

  const shippingCost = session.shipping_cost?.amount_total ?? 0;
  const method = session.shipping_cost?.shipping_rate
    ? await resolveShippingMethod(session.shipping_cost.shipping_rate)
    : null;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const transitioned = await db.order.updateMany({
    where: { id: orderId, status: { in: ["PENDING", "CANCELLED"] }, paidAt: null },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntent,
      email: session.customer_details?.email ?? null,
      phone: session.customer_details?.phone?.replace(/\D/g, "") || null,
      ...addressFrom(session),
      deliveryFee: shippingCost,
      deliveryMethod: method,
      total: session.amount_total ?? undefined,
    },
  });
  if (transitioned.count === 0) return "ignored";

  try {
    await db.$transaction((tx) => deductStock(tx, orderId));
  } catch (error) {
    // Payment is taken, so keep the order PAID and flag it for the owner.
    const reason = error instanceof UserError ? error.message : "stock update failed";
    console.error("[stripe] stock deduction failed for paid order", orderId, error);
    await db.order.update({
      where: { id: orderId },
      data: { adminNotes: `ATTENTION: paid but ${reason} Check stock and contact the customer.` },
    });
  }

  await sendNewOrderEmails(orderId, { customer: true });
  return "updated";
}

async function resolveShippingMethod(rate: string | Stripe.ShippingRate): Promise<string | null> {
  try {
    const shippingRate =
      typeof rate === "string" ? await getStripe().shippingRates.retrieve(rate) : rate;
    return shippingRate.metadata?.method ?? shippingRate.display_name ?? null;
  } catch {
    return null;
  }
}

/** checkout.session.expired / async_payment_failed: cancel the still-pending order. */
export async function handleCheckoutAbandoned(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return;
  await db.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED", cancelledAt: new Date(), adminNotes: "Checkout not completed." },
  });
}

/** Order summary for the success page, looked up by Stripe session id. */
export function getOrderBySessionId(sessionId: string) {
  return db.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: {
      orderNumber: true,
      status: true,
      email: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      publicToken: true,
      items: {
        select: {
          id: true,
          productName: true,
          size: true,
          colour: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });
}
