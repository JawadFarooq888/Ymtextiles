"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, MessageCircleIcon, ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";
import {
  ProductView,
  type ProductViewData,
  type PurchaseState,
} from "@/features/product/components/product-view";
import { useBasket } from "@/features/basket/store";
import { createWhatsAppOrder } from "@/features/whatsapp/actions";
import { openWhatsAppAfter } from "@/features/whatsapp/open-whatsapp";
import { maxQuantity } from "@/features/product/variants";
import { cn } from "@/lib/utils";

const SELECT_PROMPT = "Please select a size and colour";

export function ProductPurchase(props: {
  product: ProductViewData & { image: string | null };
  lowStockThreshold: number;
  header: React.ReactNode;
  sizeChartTrigger?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <ProductView
      {...props}
      renderActions={(state) => <PurchaseActions product={props.product} state={state} />}
    />
  );
}

function PurchaseActions({
  product,
  state,
}: {
  product: ProductViewData & { image: string | null };
  state: PurchaseState;
}) {
  const add = useBasket((s) => s.add);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { variant, quantity, unitPrice } = state;
  const ready = !!variant && variant.stock > 0;
  const anyStock = product.variants.some((v) => v.stock > 0);

  function requireSelection(): boolean {
    if (!state.selection.sizeId || !state.selection.colourId) {
      setPrompt(SELECT_PROMPT);
      return false;
    }
    if (!ready) {
      setPrompt("This size and colour is sold out. Please choose another.");
      return false;
    }
    setPrompt(null);
    return true;
  }

  function addToBasket() {
    if (!requireSelection() || !variant) return;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: variant.sku,
      size: variant.size.label,
      colour: variant.colour.name,
      image: product.image,
      unitPrice,
      quantity,
      maxQuantity: maxQuantity(variant),
    });
    toast.success("Added to your basket");
  }

  function orderOnWhatsApp() {
    if (!requireSelection() || !variant) return;
    startTransition(async () => {
      const result = await openWhatsAppAfter(() =>
        createWhatsAppOrder({ variantId: variant.id, quantity }),
      );
      if (result.ok)
        toast.success(
          `Order ${result.data.orderNumber} created. Send the message in WhatsApp to confirm.`,
        );
      else toast.error(result.error);
    });
  }

  if (!anyStock) {
    return (
      <p className="rounded-2xl bg-secondary p-4 text-sm">
        This product is sold out. Message us on WhatsApp to ask about restocks.
      </p>
    );
  }

  // Buttons look disabled until a size and colour are chosen, but stay clickable so we can explain why.
  const dimmed = !ready && "opacity-60";
  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={addToBasket}
        aria-disabled={!ready}
        aria-describedby={prompt ? "purchase-prompt" : undefined}
        className={cn(
          "flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground uppercase transition hover:bg-primary/90",
          dimmed,
        )}
      >
        <ShoppingBagIcon className="size-4" aria-hidden /> Add to basket
      </button>
      <button
        type="button"
        onClick={orderOnWhatsApp}
        aria-disabled={!ready || pending}
        aria-describedby={prompt ? "purchase-prompt" : undefined}
        className={cn(
          "flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#1f7a4d] bg-white px-6 text-sm font-medium tracking-wide text-[#14593a] uppercase transition hover:bg-[#effaf3]",
          dimmed,
        )}
      >
        {pending ? (
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
        ) : (
          <MessageCircleIcon className="size-4" aria-hidden />
        )}
        Order on WhatsApp
      </button>
      {prompt ? (
        <p id="purchase-prompt" role="alert" className="text-sm font-medium text-brand-sale">
          {prompt}
        </p>
      ) : null}
    </div>
  );
}
