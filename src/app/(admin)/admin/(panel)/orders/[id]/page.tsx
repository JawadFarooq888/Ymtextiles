import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/features/admin/components/page-header";
import { AdminNotesForm, OrderActions } from "@/features/admin/orders/order-actions";
import { StatusBadge } from "@/features/admin/orders/status-badge";
import { getOrderForAdmin } from "@/features/orders/service";
import { formatLondonDateTime } from "@/lib/dates";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  const address = [
    order.addressLine1,
    order.addressLine2,
    order.city,
    order.postcode,
    order.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={`${order.channel === "WHATSAPP" ? "WhatsApp" : "Website"} order · ${formatLondonDateTime(order.createdAt)}`}
        actions={<StatusBadge status={order.status} />}
      />
      <div className="mb-6">
        <OrderActions
          id={order.id}
          orderNumber={order.orderNumber}
          channel={order.channel}
          status={order.status}
          phone={order.phone}
          customerName={order.customerName}
        />
        {order.status === "AWAITING_WHATSAPP_CONFIRMATION" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Confirm once the customer has agreed availability, delivery and payment on WhatsApp.
            Stock is reduced when you confirm. Unconfirmed orders are cancelled automatically after
            72 hours.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-brand-ink">{item.productName}</p>
                    <p className="text-xs">
                      {item.size} · {item.colour} · <span className="font-mono">{item.sku}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatPence(item.unitPrice)}
                      {item.variant
                        ? ` · ${item.variant.stock} in stock now`
                        : " · variant deleted"}
                    </p>
                  </div>
                  <span className="font-medium">{formatPence(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid gap-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPence(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery{order.deliveryMethod ? ` (${order.deliveryMethod})` : ""}</dt>
                <dd>{formatPence(order.deliveryFee)}</dd>
              </div>
              {order.discount ? (
                <div className="flex justify-between">
                  <dt>Discount</dt>
                  <dd>-{formatPence(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-medium text-brand-ink">
                <dt>Total</dt>
                <dd>{formatPence(order.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="grid h-fit gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Customer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p className="font-medium text-brand-ink">{order.customerName ?? "Name not given"}</p>
              {order.phone ? <p>+{order.phone}</p> : null}
              {order.email ? <p>{order.email}</p> : null}
              {address ? <p>{address}</p> : null}
              {order.notes ? (
                <p className="mt-2 rounded-lg bg-secondary p-2">Customer note: {order.notes}</p>
              ) : null}
              <Link
                href={`/order/${order.publicToken}`}
                target="_blank"
                className="mt-2 inline-flex items-center gap-1 text-primary underline underline-offset-4"
              >
                Customer&apos;s order summary <ExternalLinkIcon className="size-3" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <AdminNotesForm id={order.id} initial={order.adminNotes ?? ""} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">History</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-xs">
              <p>Created: {formatLondonDateTime(order.createdAt)}</p>
              {order.confirmedAt ? (
                <p>Confirmed: {formatLondonDateTime(order.confirmedAt)}</p>
              ) : null}
              {order.paidAt ? <p>Paid: {formatLondonDateTime(order.paidAt)}</p> : null}
              {order.cancelledAt ? (
                <p>Cancelled: {formatLondonDateTime(order.cancelledAt)}</p>
              ) : null}
              <p>
                Stock reduced:{" "}
                {order.stockDeductedAt ? formatLondonDateTime(order.stockDeductedAt) : "No"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
