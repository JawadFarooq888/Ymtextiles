import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { getOrderBySessionId } from "@/features/checkout/service";
import { ClearBasket } from "@/features/checkout/components/clear-basket";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = {
  title: "Thank you for your order",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : "";
  const order = /^cs_[A-Za-z0-9_]+$/.test(sessionId) ? await getOrderBySessionId(sessionId) : null;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold">Order not found</h1>
        <p className="mt-4">
          If you have just paid, your confirmation email is on its way. Contact us if it
          doesn&apos;t arrive.
        </p>
        <Link
          href="/pages/contact"
          className="mt-6 inline-block text-primary underline underline-offset-4"
        >
          Contact us
        </Link>
      </div>
    );
  }

  // The webhook normally arrives within seconds; until then the order is still PENDING.
  const confirmed = order.status !== "PENDING";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <ClearBasket />
      <div className="text-center">
        <CheckCircle2Icon className="mx-auto size-12 text-primary" aria-hidden />
        <h1 className="mt-4 text-4xl font-semibold">Thank you for your order</h1>
        <p className="mt-3">
          Your order number is <strong className="text-brand-ink">{order.orderNumber}</strong>.
        </p>
        <p className="mt-1 text-sm">
          {confirmed
            ? `A confirmation email is on its way${order.email ? ` to ${order.email}` : ""}.`
            : "We're confirming your payment. You'll receive an email shortly."}
        </p>
      </div>

      <section
        aria-labelledby="summary"
        className="mt-10 rounded-2xl bg-card p-6 ring-1 ring-border"
      >
        <h2 id="summary" className="text-2xl font-semibold">
          Order summary
        </h2>
        <ul className="mt-4 divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                <span className="font-medium text-brand-ink">{item.productName}</span>
                <span className="block text-xs">
                  Size {item.size} · {item.colour} · Qty {item.quantity}
                </span>
              </span>
              <span>{formatPence(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid gap-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPence(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{order.deliveryFee === 0 ? "Free" : formatPence(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between text-base font-medium text-brand-ink">
            <dt>Total</dt>
            <dd>{formatPence(order.total)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
