import "server-only";
import type { OrderChannel, OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { UserError } from "@/features/admin/action-result";
import type { BasketQuote } from "@/features/basket/service";
import { WHATSAPP_ORDER_EXPIRY_HOURS, canTransition } from "@/features/orders/status";

type Tx = Prisma.TransactionClient;

// Stock changes run in transactions; allow for a slow or just-woken database.
const TX_OPTIONS = { timeout: 20_000, maxWait: 10_000 } as const;

export interface NewOrderInput {
  channel: OrderChannel;
  status: OrderStatus;
  quote: BasketQuote;
  deliveryMethod?: string | null;
  customerName?: string | null;
  email?: string | null;
  phone?: string | null;
  postcode?: string | null;
  notes?: string | null;
}

/** Create an order with item snapshots from a server-side quote (never from browser prices). */
export async function createOrder(input: NewOrderInput) {
  const lines = input.quote.lines.filter((l) => l.available);
  if (!lines.length) throw new UserError("There is nothing available to order.");
  return db.order.create({
    data: {
      channel: input.channel,
      status: input.status,
      customerName: input.customerName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      postcode: input.postcode ?? null,
      notes: input.notes ?? null,
      deliveryMethod: input.deliveryMethod ?? null,
      subtotal: input.quote.subtotal,
      deliveryFee: input.quote.deliveryFee,
      total: input.quote.total,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          productName: l.productName,
          productSlug: l.productSlug,
          sku: l.sku,
          size: l.size,
          colour: l.colour,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.unitPrice * l.quantity,
        })),
      },
    },
    include: { items: true },
  });
}

/**
 * Reduce stock for every item of the order, once. Safe to call repeatedly
 * (e.g. duplicate Stripe webhooks): the stockDeductedAt marker is claimed first.
 * Throws UserError when a variant does not have enough stock, rolling back the transaction.
 */
export async function deductStock(tx: Tx, orderId: string): Promise<boolean> {
  const claimed = await tx.order.updateMany({
    where: { id: orderId, stockDeductedAt: null },
    data: { stockDeductedAt: new Date() },
  });
  if (claimed.count === 0) return false; // already deducted

  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { variantId: true, quantity: true, sku: true },
  });
  for (const item of items) {
    if (!item.variantId) continue; // variant deleted since ordering; nothing to deduct
    const updated = await tx.variant.updateMany({
      where: { id: item.variantId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (updated.count === 0) {
      throw new UserError(`Not enough stock for ${item.sku} (needs ${item.quantity}).`);
    }
  }
  return true;
}

/** Put stock back for an order whose stock was deducted. */
export async function restoreStock(tx: Tx, orderId: string): Promise<void> {
  const released = await tx.order.updateMany({
    where: { id: orderId, stockDeductedAt: { not: null } },
    data: { stockDeductedAt: null },
  });
  if (released.count === 0) return;
  const items = await tx.orderItem.findMany({
    where: { orderId, variantId: { not: null } },
    select: { variantId: true, quantity: true },
  });
  for (const item of items) {
    await tx.variant.updateMany({
      where: { id: item.variantId! },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/** WhatsApp order confirmed by the owner: move to PROCESSING and reduce stock. */
export async function confirmWhatsAppOrder(orderId: string) {
  await db.$transaction(async (tx) => {
    const moved = await tx.order.updateMany({
      where: { id: orderId, channel: "WHATSAPP", status: "AWAITING_WHATSAPP_CONFIRMATION" },
      data: { status: "PROCESSING", confirmedAt: new Date() },
    });
    if (moved.count === 0) throw new UserError("This order is no longer awaiting confirmation.");
    await deductStock(tx, orderId);
  }, TX_OPTIONS);
}

/** Cancel an order, returning stock if it had been deducted. */
export async function cancelOrder(orderId: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order) throw new UserError("Order not found.");
    if (!canTransition(order.status, "CANCELLED")) {
      throw new UserError(`A ${order.status.toLowerCase()} order cannot be cancelled.`);
    }
    await restoreStock(tx, orderId);
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  }, TX_OPTIONS);
}

/** Generic admin status change (shipping, delivered, refunded...). */
export async function setOrderStatus(orderId: string, to: OrderStatus) {
  if (to === "CANCELLED") return cancelOrder(orderId);
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, channel: true },
  });
  if (!order) throw new UserError("Order not found.");
  if (order.status === "AWAITING_WHATSAPP_CONFIRMATION" && to === "PROCESSING") {
    return confirmWhatsAppOrder(orderId);
  }
  if (!canTransition(order.status, to)) {
    throw new UserError(
      `Cannot change a ${order.status.toLowerCase()} order to ${to.toLowerCase()}.`,
    );
  }
  await db.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: to } });
}

/** Cancel WhatsApp orders that were never confirmed. Their stock was never deducted. */
export async function expireUnconfirmedWhatsAppOrders(now = new Date()) {
  const cutoff = new Date(now.getTime() - WHATSAPP_ORDER_EXPIRY_HOURS * 60 * 60 * 1000);
  const result = await db.order.updateMany({
    where: {
      channel: "WHATSAPP",
      status: "AWAITING_WHATSAPP_CONFIRMATION",
      createdAt: { lt: cutoff },
    },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      adminNotes: "Automatically cancelled: not confirmed within 72 hours.",
    },
  });
  return result.count;
}

/** Public order summary for the private /order/[token] link. */
export function getOrderByToken(token: string) {
  return db.order.findUnique({
    where: { publicToken: token },
    select: {
      orderNumber: true,
      channel: true,
      status: true,
      customerName: true,
      postcode: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      notes: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productName: true,
          productSlug: true,
          sku: true,
          size: true,
          colour: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
    },
  });
}

// ---------- Admin queries ----------

export const ADMIN_ORDERS_PAGE_SIZE = 25;

export async function listOrders(filters: {
  channel?: OrderChannel;
  status?: OrderStatus;
  q?: string;
  page?: number;
}) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.OrderWhereInput = {
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { orderNumber: { contains: filters.q, mode: "insensitive" } },
            { customerName: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { phone: { contains: filters.q.replace(/\D/g, "") || filters.q } },
            { postcode: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_ORDERS_PAGE_SIZE,
      take: ADMIN_ORDERS_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        channel: true,
        status: true,
        customerName: true,
        phone: true,
        postcode: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_ORDERS_PAGE_SIZE)), orders };
}

export function getOrderForAdmin(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { variant: { select: { stock: true } } },
      },
    },
  });
}

export function saveAdminNotes(id: string, adminNotes: string | null) {
  return db.order.update({ where: { id }, data: { adminNotes } });
}
