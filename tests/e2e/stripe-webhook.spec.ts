import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

/**
 * Exercises the webhook handler without calling Stripe: we create a PENDING order
 * directly and post a correctly signed checkout.session.completed event.
 * The server must run with the same STRIPE_WEBHOOK_SECRET as this test.
 */
const secret = process.env.STRIPE_WEBHOOK_SECRET;
test.skip(!secret, "STRIPE_WEBHOOK_SECRET is not set");

const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

function signedEvent(type: string, session: Record<string, unknown>) {
  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    object: "event",
    type,
    data: { object: { object: "checkout.session", ...session } },
  });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: secret! });
  return { payload, header };
}

test("webhook verifies the signature, marks the order paid and reduces stock exactly once", async ({
  request,
}) => {
  const variant = await db.variant.findFirstOrThrow({
    where: { stock: { gte: 3 }, isActive: true },
    include: { product: true, size: true, colour: true },
  });
  const stockBefore = variant.stock;
  const order = await db.order.create({
    data: {
      channel: "WEBSITE",
      status: "PENDING",
      subtotal: 4500,
      total: 4500,
      stripeSessionId: `cs_test_${Date.now()}`,
      items: {
        create: {
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          productSlug: variant.product.slug,
          sku: variant.sku,
          size: variant.size.label,
          colour: variant.colour.name,
          quantity: 2,
          unitPrice: 2250,
          lineTotal: 4500,
        },
      },
    },
  });

  try {
    // Bad signature is rejected
    const bad = await request.post("/api/stripe/webhook", {
      data: "{}",
      headers: { "stripe-signature": "t=1,v1=bad", "content-type": "application/json" },
    });
    expect(bad.status()).toBe(400);

    const session = {
      id: order.stripeSessionId,
      payment_status: "paid",
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      amount_total: 4899,
      shipping_cost: { amount_total: 399, shipping_rate: null },
      payment_intent: "pi_test_123",
      customer_details: {
        email: "test@example.com",
        name: "Webhook Test",
        phone: "+447123456789",
        address: {
          line1: "1 Test Street",
          line2: null,
          city: "London",
          postal_code: "SW1A 1AA",
          country: "GB",
        },
      },
    };

    // Deliver the same event twice (Stripe can retry); the second must change nothing.
    for (let i = 0; i < 2; i++) {
      const { payload, header } = signedEvent("checkout.session.completed", session);
      const res = await request.post("/api/stripe/webhook", {
        data: payload,
        headers: { "stripe-signature": header, "content-type": "application/json" },
      });
      expect(res.status()).toBe(200);
    }

    const paid = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe("PAID");
    expect(paid.paidAt).not.toBeNull();
    expect(paid.stockDeductedAt).not.toBeNull();
    expect(paid.email).toBe("test@example.com");
    expect(paid.postcode).toBe("SW1A 1AA");
    expect(paid.phone).toBe("447123456789");
    expect(paid.deliveryFee).toBe(399);
    expect(paid.total).toBe(4899);
    const after = await db.variant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(after.stock).toBe(stockBefore - 2);
  } finally {
    await db.variant.update({ where: { id: variant.id }, data: { stock: stockBefore } });
    await db.order.delete({ where: { id: order.id } });
  }
});

test("expired checkout cancels the pending order", async ({ request }) => {
  const order = await db.order.create({
    data: {
      channel: "WEBSITE",
      status: "PENDING",
      subtotal: 100,
      total: 100,
      stripeSessionId: `cs_test_exp_${Date.now()}`,
    },
  });
  try {
    const { payload, header } = signedEvent("checkout.session.expired", {
      id: order.stripeSessionId,
      payment_status: "unpaid",
      metadata: { orderId: order.id },
    });
    const res = await request.post("/api/stripe/webhook", {
      data: payload,
      headers: { "stripe-signature": header, "content-type": "application/json" },
    });
    expect(res.status()).toBe(200);
    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("CANCELLED");
  } finally {
    await db.order.delete({ where: { id: order.id } });
  }
});
