"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BasketLine } from "@/features/basket/components/basket-line";
import { CheckoutButton } from "@/features/checkout/components/checkout-button";
import { WhatsAppBasketDialog } from "@/features/basket/components/whatsapp-basket-dialog";
import { deliveryFee, type DeliverySettings } from "@/features/basket/pricing";
import { basketSubtotal, useBasket, useHydrated } from "@/features/basket/store";
import type { BasketQuote } from "@/features/basket/service";
import { quoteBasketAction } from "@/features/whatsapp/actions";
import { formatPence } from "@/lib/money";

export function BasketView({
  delivery,
  whatsappUkOnly,
}: {
  delivery: DeliverySettings;
  whatsappUkOnly: boolean;
}) {
  const hydrated = useHydrated();
  const lines = useBasket((s) => s.lines);
  const sync = useBasket((s) => s.sync);
  const [quote, setQuote] = useState<BasketQuote | null>(null);

  // Re-check prices and stock with the server whenever the basket changes.
  const key = useMemo(() => lines.map((l) => `${l.variantId}:${l.quantity}`).join("|"), [lines]);
  useEffect(() => {
    if (!hydrated || !key) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const result = await quoteBasketAction(
        key.split("|").map((part) => {
          const [variantId, quantity] = part.split(":");
          return { variantId, quantity: Number(quantity) };
        }),
      );
      if (cancelled || !result.ok) return;
      setQuote(result.data);
      sync(
        result.data.lines.map((l) => ({
          variantId: l.variantId,
          unitPrice: l.unitPrice,
          stock: l.stock,
        })),
        result.data.missing,
      );
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hydrated, key, sync]);

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!lines.length) {
    return (
      <div className="rounded-2xl bg-secondary p-10 text-center">
        <p className="font-heading text-3xl text-brand-ink">Your basket is empty</p>
        <Link
          href="/collections/new-in"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-primary px-8 text-sm text-primary-foreground"
        >
          Shop new arrivals
        </Link>
      </div>
    );
  }

  const problems = new Map(quote?.lines.map((l) => [l.variantId, l.problem]) ?? []);
  const hasProblems = !!quote && !quote.ok;
  const subtotal = quote?.subtotal ?? basketSubtotal(lines);
  const fee = quote?.deliveryFee ?? deliveryFee(subtotal, delivery);
  const total = subtotal + fee;
  const remaining = delivery.freeDeliveryThreshold - subtotal;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <section aria-label="Items">
        <ul className="divide-y border-y">
          {lines.map((l) => (
            <BasketLine key={l.variantId} line={l} problem={problems.get(l.variantId)} />
          ))}
        </ul>
        {hasProblems ? (
          <p role="alert" className="mt-4 rounded-xl bg-brand-sale/10 p-3 text-sm text-brand-sale">
            Some items have changed since you added them. Please update or remove them before
            ordering.
          </p>
        ) : null}
      </section>

      <aside
        className="h-fit rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border lg:sticky lg:top-32"
        aria-label="Order summary"
      >
        <h2 className="text-2xl font-semibold">Order summary</h2>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPence(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>UK standard delivery</dt>
            <dd>{fee === 0 ? "Free" : formatPence(fee)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t pt-3 text-base font-medium text-brand-ink">
            <dt>Total</dt>
            <dd>{formatPence(total)}</dd>
          </div>
        </dl>
        <p className="mt-1 text-xs text-muted-foreground">
          Prices include VAT. Express delivery can be chosen at checkout.
        </p>
        {delivery.freeDeliveryThreshold > 0 && remaining > 0 ? (
          <p className="mt-3 text-xs">
            Spend {formatPence(remaining)} more for free standard delivery.
          </p>
        ) : null}
        <div className="mt-6 grid gap-3">
          <CheckoutButton disabled={hasProblems || !quote} />
          <WhatsAppBasketDialog disabled={hasProblems || !quote} ukOnly={whatsappUkOnly} />
        </div>
      </aside>
    </div>
  );
}
