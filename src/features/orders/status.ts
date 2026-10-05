import type { OrderStatus } from "@prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending payment",
  AWAITING_WHATSAPP_CONFIRMATION: "Awaiting WhatsApp confirmation",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

/** Allowed manual status changes from the admin panel. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CANCELLED"],
  AWAITING_WHATSAPP_CONFIRMATION: ["PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Statuses where items are (or are about to be) leaving stock. */
export const STOCK_HELD_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

/** Unconfirmed WhatsApp orders older than this are cancelled automatically. */
export const WHATSAPP_ORDER_EXPIRY_HOURS = 72;
