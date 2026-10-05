"use client";

import { ShoppingBagIcon } from "lucide-react";
import { basketCount, useBasket, useHydrated } from "@/features/basket/store";

export function BasketButton() {
  const hydrated = useHydrated();
  const count = useBasket((s) => basketCount(s.lines));
  const open = useBasket((s) => s.setDrawerOpen);
  const shown = hydrated ? count : 0;

  return (
    <button
      type="button"
      onClick={() => open(true)}
      aria-label={shown ? `Basket, ${shown} item${shown === 1 ? "" : "s"}` : "Basket"}
      className="relative flex size-11 items-center justify-center rounded-full text-brand-ink hover:bg-secondary"
    >
      <ShoppingBagIcon className="size-5" />
      {shown ? (
        <span
          aria-hidden
          className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-brand-sale px-1 text-[11px] leading-5 font-medium text-white"
        >
          {shown > 99 ? "99+" : shown}
        </span>
      ) : null}
    </button>
  );
}
