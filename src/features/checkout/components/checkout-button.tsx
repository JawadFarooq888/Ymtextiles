"use client";

import { useTransition } from "react";
import { Loader2Icon, LockIcon } from "lucide-react";
import { toast } from "sonner";
import { useBasket } from "@/features/basket/store";
import { startCheckoutAction } from "@/features/checkout/actions";

export function CheckoutButton({ disabled }: { disabled?: boolean }) {
  const lines = useBasket((s) => s.lines);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending || !lines.length}
      onClick={() =>
        startTransition(async () => {
          const result = await startCheckoutAction(
            lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          );
          if (result.ok) window.location.assign(result.data.url);
          else toast.error(result.error);
        })
      }
      className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground uppercase hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
      ) : (
        <LockIcon className="size-4" aria-hidden />
      )}
      Checkout securely
    </button>
  );
}
