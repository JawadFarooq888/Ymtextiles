"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import {
  colourAvailable,
  sizeAvailable,
  uniqueColours,
  uniqueSizes,
  type SelectableVariant,
  type Selection,
} from "@/features/product/variants";
import { cn } from "@/lib/utils";

interface Props {
  variants: SelectableVariant[];
  selection: Selection;
  onChange: (next: Selection) => void;
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (q: number) => void;
  sizeChartTrigger?: React.ReactNode;
}

export function VariantSelector({
  variants,
  selection,
  onChange,
  quantity,
  maxQuantity,
  onQuantityChange,
  sizeChartTrigger,
}: Props) {
  const sizes = uniqueSizes(variants);
  const colours = uniqueColours(variants);
  const selectedColour = colours.find((c) => c.id === selection.colourId);
  const selectedSize = sizes.find((s) => s.id === selection.sizeId);

  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="mb-3 text-sm">
          <span className="font-medium text-brand-ink">Colour:</span>{" "}
          {selectedColour?.name ?? "Please choose"}
        </legend>
        <div className="flex flex-wrap gap-2">
          {colours.map((c) => {
            const available = colourAvailable(variants, c.id, selection.sizeId);
            const selected = selection.colourId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                aria-label={`${c.name}${available ? "" : " (sold out in this size)"}`}
                title={c.name}
                onClick={() => onChange({ ...selection, colourId: selected ? null : c.id })}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-full border-2 transition",
                  selected ? "border-primary" : "border-transparent hover:border-border",
                  !available && "opacity-40",
                )}
              >
                <span
                  className="size-8 rounded-full border border-black/10"
                  style={{ backgroundColor: c.hex }}
                />
                {!available ? (
                  <span className="absolute h-0.5 w-9 rotate-45 bg-brand-ink/60" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <div className="mb-3 flex items-center justify-between gap-2">
          <legend className="text-sm">
            <span className="font-medium text-brand-ink">Size:</span>{" "}
            {selectedSize?.label ?? "Please choose"}
          </legend>
          {sizeChartTrigger}
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const available = sizeAvailable(variants, s.id, selection.colourId);
            const selected = selection.sizeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={selected}
                disabled={!available}
                onClick={() => onChange({ ...selection, sizeId: selected ? null : s.id })}
                className={cn(
                  "flex min-h-11 min-w-14 flex-col items-center justify-center rounded-full border px-4 text-sm transition",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:border-primary",
                  !available &&
                    "cursor-not-allowed border-dashed text-muted-foreground line-through hover:border-input",
                )}
              >
                {s.label}
                {!available ? <span className="text-[10px] no-underline">Sold out</span> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <p id="qty-label" className="mb-3 text-sm font-medium text-brand-ink">
          Quantity
        </p>
        <div
          role="group"
          aria-labelledby="qty-label"
          className="inline-flex items-center rounded-full border border-input bg-background"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => onQuantityChange(quantity - 1)}
            className="flex size-11 items-center justify-center rounded-full disabled:opacity-40"
          >
            <MinusIcon className="size-4" />
          </button>
          <output aria-live="polite" className="w-8 text-center text-sm">
            {quantity}
          </output>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= maxQuantity}
            onClick={() => onQuantityChange(quantity + 1)}
            className="flex size-11 items-center justify-center rounded-full disabled:opacity-40"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
