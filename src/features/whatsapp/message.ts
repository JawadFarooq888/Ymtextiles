import { formatPence } from "@/lib/money";
import { buildWhatsAppUrl } from "@/features/whatsapp/url";

export { buildWhatsAppUrl };

export interface WhatsAppOrderItem {
  productName: string;
  productSlug: string | null;
  sku: string;
  size: string;
  colour: string;
  quantity: number;
  unitPrice: number; // pence
  lineTotal: number; // pence
}

export interface WhatsAppOrder {
  orderNumber: string;
  publicToken: string;
  customerName?: string | null;
  postcode?: string | null;
  notes?: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: WhatsAppOrderItem[];
}

export interface WhatsAppSettings {
  whatsappGreeting: string;
  whatsappNumber: string;
}

/**
 * Keep the whole wa.me URL comfortably under the length that WhatsApp and
 * browsers handle reliably. Longer baskets get a short message with a link.
 */
export const MAX_WHATSAPP_URL_LENGTH = 2000;

const CLOSING = "Please confirm availability and delivery.";

function productLink(siteUrl: string, slug: string | null) {
  return slug ? `${siteUrl}/products/${slug}` : null;
}

function singleItemMessage(order: WhatsAppOrder, settings: WhatsAppSettings, siteUrl: string) {
  const item = order.items[0];
  const link = productLink(siteUrl, item.productSlug);
  return [
    settings.whatsappGreeting,
    "",
    `Order ref: ${order.orderNumber}`,
    `Product: ${item.productName}`,
    `SKU: ${item.sku}`,
    `Size: ${item.size}`,
    `Colour: ${item.colour}`,
    `Quantity: ${item.quantity}`,
    `Price: ${formatPence(item.unitPrice)} each`,
    `Total: ${formatPence(item.lineTotal)}`,
    ...(link ? ["", `Link: ${link}`] : []),
    ...(order.notes ? ["", `Note: ${order.notes}`] : []),
    "",
    CLOSING,
  ].join("\n");
}

function basketMessage(order: WhatsAppOrder, settings: WhatsAppSettings) {
  return [
    settings.whatsappGreeting,
    "",
    `Order ref: ${order.orderNumber}`,
    ...(order.customerName ? [`Name: ${order.customerName}`] : []),
    ...(order.postcode ? [`Postcode: ${order.postcode}`] : []),
    "",
    ...order.items.map(
      (item, i) =>
        `${i + 1}. ${item.productName} (SKU ${item.sku})\n   Size: ${item.size}, Colour: ${item.colour}, Qty: ${item.quantity} = ${formatPence(item.lineTotal)}`,
    ),
    "",
    `Subtotal: ${formatPence(order.subtotal)}`,
    `Delivery: ${order.deliveryFee === 0 ? "Free" : formatPence(order.deliveryFee)}`,
    `Total: ${formatPence(order.total)}`,
    ...(order.notes ? ["", `Note: ${order.notes}`] : []),
    "",
    CLOSING,
  ].join("\n");
}

function shortMessage(order: WhatsAppOrder, settings: WhatsAppSettings, siteUrl: string) {
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  return [
    settings.whatsappGreeting,
    "",
    `Order ref: ${order.orderNumber}`,
    ...(order.customerName ? [`Name: ${order.customerName}`] : []),
    ...(order.postcode ? [`Postcode: ${order.postcode}`] : []),
    `Items: ${count}`,
    `Total: ${formatPence(order.total)}`,
    "",
    `Full order details: ${siteUrl}/order/${order.publicToken}`,
    "",
    CLOSING,
  ].join("\n");
}

/**
 * Plain-text WhatsApp message for an order. A single item without customer details
 * uses the product format; baskets list every line. If the result would make the
 * wa.me link too long, a short message with a private order link is used instead.
 */
export function buildWhatsAppMessage(
  order: WhatsAppOrder,
  settings: WhatsAppSettings,
  siteUrl: string,
): string {
  const site = siteUrl.replace(/\/+$/, "");
  const isSingle = order.items.length === 1 && !order.customerName;
  const full = isSingle ? singleItemMessage(order, settings, site) : basketMessage(order, settings);
  if (buildWhatsAppUrl(settings.whatsappNumber, full).length <= MAX_WHATSAPP_URL_LENGTH)
    return full;
  return shortMessage(order, settings, site);
}
