export interface SelectableVariant {
  id: string;
  sku: string;
  stock: number;
  priceOverride: number | null;
  size: { id: string; label: string; sortOrder: number };
  colour: { id: string; name: string; hex: string };
}

export interface Selection {
  sizeId: string | null;
  colourId: string | null;
}

export function uniqueSizes(variants: SelectableVariant[]) {
  const map = new Map(variants.map((v) => [v.size.id, v.size]));
  return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function uniqueColours(variants: SelectableVariant[]) {
  const map = new Map(variants.map((v) => [v.colour.id, v.colour]));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Is there stock for this size, given the colour already chosen (or any colour if none)? */
export function sizeAvailable(
  variants: SelectableVariant[],
  sizeId: string,
  colourId: string | null,
) {
  return variants.some(
    (v) => v.size.id === sizeId && v.stock > 0 && (colourId === null || v.colour.id === colourId),
  );
}

/** Is there stock for this colour, given the size already chosen (or any size if none)? */
export function colourAvailable(
  variants: SelectableVariant[],
  colourId: string,
  sizeId: string | null,
) {
  return variants.some(
    (v) => v.colour.id === colourId && v.stock > 0 && (sizeId === null || v.size.id === sizeId),
  );
}

export function findVariant(variants: SelectableVariant[], sel: Selection) {
  if (!sel.sizeId || !sel.colourId) return null;
  return variants.find((v) => v.size.id === sel.sizeId && v.colour.id === sel.colourId) ?? null;
}

/** Pre-select an option when there is only one choice (e.g. "Unstitched" as the only size). */
export function initialSelection(variants: SelectableVariant[]): Selection {
  const sizes = uniqueSizes(variants);
  const colours = uniqueColours(variants);
  return {
    sizeId: sizes.length === 1 ? sizes[0].id : null,
    colourId: colours.length === 1 ? colours[0].id : null,
  };
}

/** Unit price in pence: variant override first, then sale price, then regular price. */
export function unitPrice(
  product: { basePrice: number; salePrice: number | null },
  variant: Pick<SelectableVariant, "priceOverride"> | null,
): number {
  return variant?.priceOverride ?? product.salePrice ?? product.basePrice;
}

export const MAX_QUANTITY_PER_LINE = 10;

export function maxQuantity(variant: Pick<SelectableVariant, "stock"> | null): number {
  return variant
    ? Math.max(0, Math.min(variant.stock, MAX_QUANTITY_PER_LINE))
    : MAX_QUANTITY_PER_LINE;
}
