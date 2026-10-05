"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BasketLine } from "@/features/basket/components/basket-line";
import { basketCount, basketSubtotal, useBasket, useHydrated } from "@/features/basket/store";
import { formatPence } from "@/lib/money";

export function BasketDrawer({ freeDeliveryThreshold }: { freeDeliveryThreshold: number }) {
  const hydrated = useHydrated();
  const { lines, drawerOpen, setDrawerOpen } = useBasket();
  const pathname = usePathname();
  const close = () => setDrawerOpen(false);

  // Close when navigating (e.g. to the basket page).
  useEffect(() => setDrawerOpen(false), [pathname, setDrawerOpen]);

  const items = hydrated ? lines : [];
  const subtotal = basketSubtotal(items);
  const remaining = freeDeliveryThreshold - subtotal;

  return (
    <Sheet open={hydrated && drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" className="flex w-full flex-col bg-background sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="font-heading text-2xl">Your basket</SheetTitle>
          <SheetDescription>
            {basketCount(items)} item{basketCount(items) === 1 ? "" : "s"}
          </SheetDescription>
        </SheetHeader>
        {items.length ? (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {items.map((l) => (
                <BasketLine key={l.variantId} line={l} onNavigate={close} />
              ))}
            </ul>
            <SheetFooter className="border-t">
              {freeDeliveryThreshold > 0 ? (
                <p className="text-center text-xs">
                  {remaining > 0
                    ? `Spend ${formatPence(remaining)} more for free UK delivery`
                    : "You qualify for free UK standard delivery"}
                </p>
              ) : null}
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium text-brand-ink">{formatPence(subtotal)}</span>
              </div>
              <Link
                href="/basket"
                onClick={close}
                className="flex min-h-12 items-center justify-center rounded-full bg-primary text-sm font-medium tracking-wide text-primary-foreground uppercase"
              >
                View basket and checkout
              </Link>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-heading text-2xl text-brand-ink">Your basket is empty</p>
            <Link
              href="/collections/new-in"
              onClick={close}
              className="flex min-h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground"
            >
              Shop new arrivals
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
