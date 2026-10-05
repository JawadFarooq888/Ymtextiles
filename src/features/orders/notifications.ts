import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site";
import { AdminNewOrderEmail, OrderConfirmationEmail, type EmailOrder } from "@/emails/order-emails";

async function loadEmailOrder(orderId: string): Promise<(EmailOrder & { id: string }) | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return null;
  const address = [order.addressLine1, order.addressLine2, order.city, order.postcode]
    .filter(Boolean)
    .join(", ");
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    channel: order.channel,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    address: address || null,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    deliveryMethod: order.deliveryMethod,
    total: order.total,
    notes: order.notes,
    items: order.items,
  };
}

/** Customer confirmation (if we have their email) and admin alert. Never throws. */
export async function sendNewOrderEmails(orderId: string, options: { customer: boolean }) {
  try {
    const [order, settings] = await Promise.all([loadEmailOrder(orderId), getSettings()]);
    if (!order) return;
    const siteUrl = getSiteUrl();
    const jobs: Promise<boolean>[] = [];
    if (options.customer && order.email) {
      jobs.push(
        sendEmail({
          to: order.email,
          subject: `Your YM Textiles order ${order.orderNumber}`,
          replyTo: settings.contactEmail ?? process.env.ADMIN_ALERT_EMAIL,
          react: OrderConfirmationEmail({
            order,
            siteUrl,
            storeName: settings.storeName,
            returnsDays: settings.returnsDays,
          }),
        }),
      );
    }
    const adminEmail = process.env.ADMIN_ALERT_EMAIL;
    if (adminEmail) {
      jobs.push(
        sendEmail({
          to: adminEmail,
          subject: `New ${order.channel === "WHATSAPP" ? "WhatsApp" : "website"} order ${order.orderNumber}`,
          react: AdminNewOrderEmail({ order, adminUrl: `${siteUrl}/admin/orders/${order.id}` }),
        }),
      );
    }
    await Promise.all(jobs);
  } catch (error) {
    console.error("[email] new order emails failed", orderId, error);
  }
}
