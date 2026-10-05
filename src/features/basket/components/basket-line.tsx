"use client";

import Image from "next/image";
import Link from "next/link";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { ImagePlaceholder } from "@/features/catalog/components/image-placeholder";
import { useBasket, type BasketLine as Line } from "@/features/basket/store";
import { cloudinaryUrl } from "@/lib/image";
import { formatPence } from "@/lib/money";

export function BasketLine({
  line,
  problem,
  onNavigate,
}: {
  line: Line;
  problem?: string | null;
  onNavigate?: () => void;
}) {
  const setQuantity = useBasket((s) => s.setQuantity);
  const remove = useBasket((s) => s.remove);

  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/products/${line.slug}`}
        onClick={onNavigate}
        className="relative h-28 w-21 shrink-0 overflow-hidden rounded-xl bg-secondary"
      >
        {line.image ? (
          <Image
            src={cloudinaryUrl(line.image, 200)}
            alt=""
            fill
            sizes="84px"
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder className="[&>span]:text-xl [&>span:last-child]:hidden" label="" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-2">
          <Link
            href={`/products/${line.slug}`}
            onClick={onNavigate}
            className="text-sm font-medium text-brand-ink hover:underline"
          >
            {line.name}
          </Link>
          <p className="shrink-0 text-sm font-medium text-brand-ink">
            {formatPence(line.unitPrice * line.quantity)}
          </p>
        </div>
        <p className="mt-1 text-xs">
          Size: {line.size} · Colour: {line.colour}
        </p>
        <p className="text-xs text-muted-foreground">{formatPence(line.unitPrice)} each</p>
        {problem ? (
          <p role="alert" className="mt-1 text-xs font-medium text-brand-sale">
            {problem}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div
            role="group"
            aria-label={`Quantity of ${line.name}`}
            className="inline-flex items-center rounded-full border border-input"
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={line.quantity <= 1}
              onClick={() => setQuantity(line.variantId, line.quantity - 1)}
              className="flex size-9 items-center justify-center rounded-full disabled:opacity-40"
            >
              <MinusIcon className="size-3.5" />
            </button>
            <output className="w-7 text-center text-sm">{line.quantity}</output>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={line.quantity >= line.maxQuantity}
              onClick={() => setQuantity(line.variantId, line.quantity + 1)}
              className="flex size-9 items-center justify-center rounded-full disabled:opacity-40"
            >
              <PlusIcon className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            aria-label={`Remove ${line.name} from basket`}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-brand-sale"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
