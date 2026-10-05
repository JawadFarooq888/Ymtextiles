import "server-only";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { startOfLondonDay, startOfLondonWeek } from "@/lib/dates";

const REVENUE_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export async function getDashboardData() {
  const settings = await db.settings.findUnique({
    where: { id: 1 },
    select: { lowStockThreshold: true },
  });
  const threshold = settings?.lowStockThreshold ?? 3;

  const [todayOrders, pendingWhatsApp, pendingWhatsAppCount, revenue, lowStock, productCount] =
    await Promise.all([
      db.order.count({ where: { createdAt: { gte: startOfLondonDay() } } }),
      db.order.findMany({
        where: { status: "AWAITING_WHATSAPP_CONFIRMATION" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, orderNumber: true, customerName: true, total: true, createdAt: true },
      }),
      db.order.count({ where: { status: "AWAITING_WHATSAPP_CONFIRMATION" } }),
      db.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: startOfLondonWeek() } },
      }),
      db.variant.findMany({
        where: { isActive: true, stock: { lte: threshold }, product: { isActive: true } },
        orderBy: [{ stock: "asc" }, { sku: "asc" }],
        take: 10,
        select: {
          id: true,
          sku: true,
          stock: true,
          size: { select: { label: true } },
          colour: { select: { name: true } },
          product: { select: { id: true, name: true } },
        },
      }),
      db.product.count({ where: { isActive: true } }),
    ]);

  return {
    threshold,
    todayOrders,
    pendingWhatsApp,
    pendingWhatsAppCount,
    weekRevenue: revenue._sum.total ?? 0,
    weekPaidOrders: revenue._count,
    lowStock,
    productCount,
  };
}
