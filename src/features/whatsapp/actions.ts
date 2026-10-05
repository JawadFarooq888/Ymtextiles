"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sendNewOrderEmails } from "@/features/orders/notifications";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";
import { checkRateLimit } from "@/lib/rate-limit";
import { quoteBasket, type BasketQuote } from "@/features/basket/service";
import { basketLinesSchema } from "@/features/basket/schema";
import { createOrder } from "@/features/orders/service";
import { basketWhatsAppOrderSchema, productWhatsAppOrderSchema } from "@/features/whatsapp/schema";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/features/whatsapp/message";
import {
  fail,
  fromUnknownError,
  fromZodError,
  ok,
  type ActionResult,
} from "@/features/admin/action-result";

export interface WhatsAppOrderResult {
  orderNumber: string;
  url: string;
}

const RATE_LIMIT_MESSAGE = "Too many orders in a short time. Please wait a minute and try again.";

async function finish(
  order: Awaited<ReturnType<typeof createOrder>>,
  settings: Awaited<ReturnType<typeof getSettings>>,
) {
  const message = buildWhatsAppMessage(order, settings, getSiteUrl());
  revalidatePath("/admin/orders");
  // Alert the owner by email after the response, so opening WhatsApp isn't delayed.
  after(() => sendNewOrderEmails(order.id, { customer: false }));
  return ok<WhatsAppOrderResult>({
    orderNumber: order.orderNumber,
    url: buildWhatsAppUrl(settings.whatsappNumber, message),
  });
}

/** "Order on WhatsApp" from the product page: one variant and quantity. */
export async function createWhatsAppOrder(
  input: unknown,
): Promise<ActionResult<WhatsAppOrderResult>> {
  const parsed = productWhatsAppOrderSchema.safeParse(input);
  if (!parsed.success) return fail("Please select a size and colour");
  if (!(await checkRateLimit("whatsapp-order", 10, "10 m"))) return fail(RATE_LIMIT_MESSAGE);

  try {
    const settings = await getSettings();
    // Single-item orders leave delivery to be agreed on WhatsApp, matching the message format.
    const quote = await quoteBasket([parsed.data], {
      ...settings,
      standardDeliveryFee: 0,
      expressDeliveryFee: 0,
    });
    const line = quote.lines[0];
    if (!line) return fail("This item is no longer available.");
    if (line.problem)
      return fail(
        line.problem === "Sold out" ? "Sorry, this size and colour is sold out." : line.problem,
      );

    const order = await createOrder({
      channel: "WHATSAPP",
      status: "AWAITING_WHATSAPP_CONFIRMATION",
      quote,
    });
    return finish(order, settings);
  } catch (error) {
    return fromUnknownError(error, "createWhatsAppOrder");
  }
}

/** "Order whole basket on WhatsApp": customer details plus every line. */
export async function createWhatsAppBasketOrder(
  input: unknown,
): Promise<ActionResult<WhatsAppOrderResult>> {
  const parsed = basketWhatsAppOrderSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  if (!(await checkRateLimit("whatsapp-order", 10, "10 m"))) return fail(RATE_LIMIT_MESSAGE);

  try {
    const settings = await getSettings();
    const quote = await quoteBasket(parsed.data.lines, settings, "standard");
    if (!quote.ok) {
      return fail(
        "Some items in your basket have changed. Please review your basket and try again.",
      );
    }
    const order = await createOrder({
      channel: "WHATSAPP",
      status: "AWAITING_WHATSAPP_CONFIRMATION",
      quote,
      deliveryMethod: "standard",
      customerName: parsed.data.name,
      phone: parsed.data.phone,
      postcode: parsed.data.postcode,
      notes: parsed.data.note,
    });
    return finish(order, settings);
  } catch (error) {
    return fromUnknownError(error, "createWhatsAppBasketOrder");
  }
}

/** Current prices, stock and totals for the basket page. */
export async function quoteBasketAction(lines: unknown): Promise<ActionResult<BasketQuote>> {
  const parsed = basketLinesSchema.safeParse(lines);
  if (!parsed.success) return fail("Your basket is empty");
  try {
    const settings = await getSettings();
    return ok(await quoteBasket(parsed.data, settings, "standard"));
  } catch (error) {
    return fromUnknownError(error, "quoteBasket");
  }
}
