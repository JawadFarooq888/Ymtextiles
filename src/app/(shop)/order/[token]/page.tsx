import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/features/orders/service";
import { STATUS_LABELS } from "@/features/orders/status";
import { formatLondonDateTime } from "@/lib/dates";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = {
  title: "Order summary",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

export default async function OrderSummaryPage({ params }: { params: Params }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const order = await getOrderByToken(token);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs tracking-[0.3em] text-brand-gold-dark uppercase">Order summary</p>
      <h1 className="mt-2 text-4xl font-semibold">{order.orderNumber}</h1>
      <p className="mt-2 text-sm">
        Placed {formatLondonDateTime(order.createdAt)} ·{" "}
        {order.channel === "WHATSAPP" ? "WhatsApp order" : "Website order"} ·{" "}
        <span className="font-medium text-brand-ink">{STATUS_LABELS[order.status]}</span>
      </p>
      {order.customerName ? (
        <p className="mt-1 text-sm">
          {order.customerName}
          {order.postcode ? `, ${order.postcode}` : ""}
        </p>
      ) : null}

      <ul className="mt-8 divide-y border-y">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-4 text-sm">
            <div>
              {item.productSlug ? (
                <Link
                  href={`/products/${item.productSlug}`}
                  className="font-medium text-brand-ink hover:underline"
                >
                  {item.productName}
                </Link>
              ) : (
                <span className="font-medium text-brand-ink">{item.productName}</span>
              )}
              <p className="text-xs">
                Size: {item.size} · Colour: {item.colour} · SKU: {item.sku}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} × {formatPence(item.unitPrice)}
              </p>
            </div>
            <span className="font-medium text-brand-ink">{formatPence(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid gap-1 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatPence(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd>
            {order.deliveryFee === 0 ? "Free / to be confirmed" : formatPence(order.deliveryFee)}
          </dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-medium text-brand-ink">
          <dt>Total</dt>
          <dd>{formatPence(order.total)}</dd>
        </div>
      </dl>
      {order.notes ? (
        <p className="mt-4 rounded-xl bg-secondary p-3 text-sm">Note: {order.notes}</p>
      ) : null}
    </div>
  );
}
