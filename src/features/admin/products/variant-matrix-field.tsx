"use client";

import { useState } from "react";
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Trash2Icon, WandSparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  variantSku,
  type ProductData,
  type ProductFormValues,
} from "@/features/admin/products/schema";

interface Props {
  control: Control<ProductFormValues, unknown, ProductData>;
  register: UseFormRegister<ProductFormValues>;
  getValues: UseFormGetValues<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  sizes: { id: string; label: string; waist: number | null; length: number | null }[];
  colours: { id: string; name: string; hex: string }[];
}

export function VariantMatrixField({
  control,
  register,
  getValues,
  setValue,
  errors,
  sizes,
  colours,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
    keyName: "fieldKey",
  });
  const sizeById = new Map(sizes.map((s) => [s.id, s]));
  const jeansSizes = sizes.filter((s) => s.waist !== null && s.length !== null);
  const otherSizes = sizes.filter((s) => s.waist === null || s.length === null);
  const waists = [...new Set(jeansSizes.map((s) => s.waist!))].sort((a, b) => a - b);
  const lengths = [...new Set(jeansSizes.map((s) => s.length!))].sort((a, b) => a - b);
  const existingSizes = getValues("variants").map((v) => sizeById.get(v.sizeId));

  const [pickedWaists, setPickedWaists] = useState<Set<number>>(
    () => new Set(existingSizes.flatMap((s) => (s?.waist != null ? [s.waist] : []))),
  );
  const [pickedLengths, setPickedLengths] = useState<Set<number>>(
    () => new Set(existingSizes.flatMap((s) => (s?.length != null ? [s.length] : []))),
  );
  const [pickedOther, setPickedOther] = useState<Set<string>>(
    () =>
      new Set(
        existingSizes.flatMap((s) => (s && (s.waist === null || s.length === null) ? [s.id] : [])),
      ),
  );
  const [pickedColours, setPickedColours] = useState<Set<string>>(
    () => new Set(getValues("variants").map((v) => v.colourId)),
  );
  const [bulkStock, setBulkStock] = useState("");

  const colourById = new Map(colours.map((c) => [c.id, c]));

  /** Sizes for the picked waists × lengths (only combinations that exist in Sizes) plus other picked sizes. */
  const chosenSizes = [
    ...jeansSizes.filter((s) => pickedWaists.has(s.waist!) && pickedLengths.has(s.length!)),
    ...otherSizes.filter((s) => pickedOther.has(s.id)),
  ];

  function toggle<T>(set: Set<T>, id: T, update: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update(next);
  }

  function generate() {
    const productSku = String(getValues("sku") ?? "")
      .trim()
      .toUpperCase();
    if (!productSku) {
      toast.error("Enter the product SKU first. Variant SKUs are built from it.");
      return;
    }
    const existing = new Set(getValues("variants").map((v) => `${v.sizeId}:${v.colourId}`));
    let added = 0;
    for (const size of chosenSizes) {
      for (const colour of colours.filter((c) => pickedColours.has(c.id))) {
        if (existing.has(`${size.id}:${colour.id}`)) continue;
        append({
          sizeId: size.id,
          colourId: colour.id,
          sku: variantSku(productSku, size.label, colour.name),
          stock: "0",
          priceOverride: "",
          isActive: true,
        });
        added++;
      }
    }
    toast.message(added ? `Added ${added} variant(s)` : "All selected combinations already exist");
  }

  function applyBulkStock() {
    const n = Number(bulkStock);
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Enter a whole number");
      return;
    }
    fields.forEach((_, i) => setValue(`variants.${i}.stock`, String(n), { shouldDirty: true }));
  }

  const variantErrors = errors.variants;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          {waists.length ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-brand-ink">Waist</legend>
              <div className="flex flex-wrap gap-2">
                {waists.map((w) => (
                  <Label
                    key={w}
                    className="flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-normal has-[[data-state=checked]]:border-primary"
                  >
                    <Checkbox
                      checked={pickedWaists.has(w)}
                      onCheckedChange={() => toggle(pickedWaists, w, setPickedWaists)}
                    />
                    W{w}
                  </Label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {lengths.length ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-brand-ink">Length</legend>
              <div className="flex flex-wrap gap-2">
                {lengths.map((l) => (
                  <Label
                    key={l}
                    className="flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-normal has-[[data-state=checked]]:border-primary"
                  >
                    <Checkbox
                      checked={pickedLengths.has(l)}
                      onCheckedChange={() => toggle(pickedLengths, l, setPickedLengths)}
                    />
                    L{l}
                  </Label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {otherSizes.length ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-brand-ink">
                {jeansSizes.length ? "Other sizes (e.g. kids)" : "Sizes"}
              </legend>
              <div className="flex flex-wrap gap-2">
                {otherSizes.map((sz) => (
                  <Label
                    key={sz.id}
                    className="flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-normal has-[[data-state=checked]]:border-primary"
                  >
                    <Checkbox
                      checked={pickedOther.has(sz.id)}
                      onCheckedChange={() => toggle(pickedOther, sz.id, setPickedOther)}
                    />
                    {sz.label}
                  </Label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Waist × length sizes come from Admin → Sizes &amp; washes. {chosenSizes.length} size(s)
            selected.
          </p>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-brand-ink">Washes / colours</legend>
          <div className="flex flex-wrap gap-2">
            {colours.map((c) => (
              <Label
                key={c.id}
                className="flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-normal has-[[data-state=checked]]:border-primary"
              >
                <Checkbox
                  checked={pickedColours.has(c.id)}
                  onCheckedChange={() => toggle(pickedColours, c.id, setPickedColours)}
                />
                <span
                  className="size-3.5 rounded-full border"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden
                />
                {c.name}
              </Label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={generate}
          disabled={!chosenSizes.length || !pickedColours.size}
        >
          <WandSparklesIcon /> Generate variants
        </Button>
        <span className="text-xs text-muted-foreground">
          Creates every selected size × colour that doesn&apos;t exist yet.
        </span>
      </div>

      {fields.length > 0 ? (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <Label htmlFor="bulk-stock" className="text-xs">
                Set stock for all rows
              </Label>
              <Input
                id="bulk-stock"
                type="number"
                min={0}
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                className="h-8 w-28"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={applyBulkStock}>
              Apply
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-secondary text-left text-xs">
                <tr>
                  <th className="p-2 font-medium">Size</th>
                  <th className="p-2 font-medium">Colour</th>
                  <th className="p-2 font-medium">SKU</th>
                  <th className="p-2 font-medium">Stock</th>
                  <th className="p-2 font-medium">Price override (£)</th>
                  <th className="p-2 font-medium">Available</th>
                  <th className="p-2">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, i) => {
                  const size = sizeById.get(field.sizeId);
                  const colour = colourById.get(field.colourId);
                  const rowError = variantErrors?.[i];
                  const message =
                    rowError?.sizeId?.message ??
                    rowError?.sku?.message ??
                    rowError?.stock?.message ??
                    rowError?.priceOverride?.message;
                  return (
                    <tr key={field.fieldKey} className="border-t align-top">
                      <td className="p-2 font-medium">{size?.label ?? "?"}</td>
                      <td className="p-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-3.5 rounded-full border"
                            style={{ backgroundColor: colour?.hex }}
                            aria-hidden
                          />
                          {colour?.name ?? "?"}
                        </span>
                      </td>
                      <td className="p-2">
                        <Input
                          aria-label={`SKU for ${size?.label} ${colour?.name}`}
                          className="h-8 min-w-40 font-mono text-xs"
                          {...register(`variants.${i}.sku`)}
                        />
                        {message ? (
                          <p role="alert" className="mt-1 text-xs text-destructive">
                            {message}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          aria-label={`Stock for ${size?.label} ${colour?.name}`}
                          className="h-8 w-20"
                          {...register(`variants.${i}.stock`)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          inputMode="decimal"
                          placeholder="—"
                          aria-label={`Price override for ${size?.label} ${colour?.name}`}
                          className="h-8 w-24"
                          {...register(`variants.${i}.priceOverride`)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          aria-label={`${size?.label} ${colour?.name} available`}
                          className="mt-2 size-4 accent-primary"
                          {...register(`variants.${i}.isActive`)}
                        />
                      </td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${size?.label} ${colour?.name}`}
                          onClick={() => remove(i)}
                        >
                          <Trash2Icon />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No variants yet. Pick sizes and colours above, then click Generate. A product needs at
          least one variant to be orderable.
        </p>
      )}
    </div>
  );
}
