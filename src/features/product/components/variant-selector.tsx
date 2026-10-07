"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import {
  colourAvailableFor,
  isWaistLengthSizing,
  lengthAvailable,
  sizeAvailable,
  sizeIdFor,
  uniqueColours,
  uniqueLengths,
  uniqueSizes,
  uniqueWaists,
  waistAvailable,
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
  const waistLength = isWaistLengthSizing(variants);

  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="mb-3 text-sm">
          <span className="font-medium text-brand-ink">Wash:</span>{" "}
          {selectedColour?.name ?? "Please choose"}
        </legend>
        <div className="flex flex-wrap gap-2">
          {colours.map((c) => {
            const available = colourAvailableFor(variants, c.id, selection);
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

      {waistLength ? (
        <>
          <OptionGroup
            title="Waist"
            value={selection.waist != null ? `W${selection.waist}` : null}
            aside={sizeChartTrigger}
            options={uniqueWaists(variants).map((w) => ({
              key: String(w),
              label: `W${w}`,
              selected: selection.waist === w,
              available: waistAvailable(variants, w, selection),
              onClick: () => {
                const waist = selection.waist === w ? null : w;
                onChange({
                  ...selection,
                  waist,
                  sizeId: sizeIdFor(variants, waist, selection.length ?? null),
                });
              },
            }))}
          />
          <OptionGroup
            title="Length"
            value={selection.length != null ? `L${selection.length}` : null}
            options={uniqueLengths(variants).map((l) => ({
              key: String(l),
              label: `L${l}`,
              selected: selection.length === l,
              available: lengthAvailable(variants, l, selection),
              onClick: () => {
                const length = selection.length === l ? null : l;
                onChange({
                  ...selection,
                  length,
                  sizeId: sizeIdFor(variants, selection.waist ?? null, length),
                });
              },
            }))}
          />
        </>
      ) : (
        <OptionGroup
          title="Size"
          value={selectedSize?.label ?? null}
          aside={sizeChartTrigger}
          options={sizes.map((sz) => ({
            key: sz.id,
            label: sz.label,
            selected: selection.sizeId === sz.id,
            available: sizeAvailable(variants, sz.id, selection.colourId),
            onClick: () =>
              onChange({ ...selection, sizeId: selection.sizeId === sz.id ? null : sz.id }),
          }))}
        />
      )}

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

interface Option {
  key: string;
  label: string;
  selected: boolean;
  available: boolean;
  onClick: () => void;
}

/** A row of choice buttons; options sold out for the current selection are disabled. */
function OptionGroup({
  title,
  value,
  options,
  aside,
}: {
  title: string;
  value: string | null;
  options: Option[];
  aside?: React.ReactNode;
}) {
  return (
    <fieldset>
      {/* The legend must be the fieldset's first child so screen readers name the group. */}
      <legend className="float-left mb-3 text-sm">
        <span className="font-medium text-brand-ink">{title}:</span> {value ?? "Please choose"}
      </legend>
      {aside ? <div className="-mt-1 mb-3 flex justify-end">{aside}</div> : null}
      <div className="clear-both" />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={o.selected}
            disabled={!o.available}
            onClick={o.onClick}
            className={cn(
              "flex min-h-11 min-w-14 flex-col items-center justify-center rounded-full border px-4 text-sm transition",
              o.selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:border-primary",
              !o.available &&
                "cursor-not-allowed border-dashed text-muted-foreground line-through hover:border-input",
            )}
          >
            {o.label}
            {!o.available ? <span className="text-[10px] no-underline">Sold out</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
