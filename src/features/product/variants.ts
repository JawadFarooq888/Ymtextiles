export interface SelectableVariant {
  id: string;
  sku: string;
  stock: number;
  priceOverride: number | null;
  /** waist/length in inches for jeans sizes (both set), otherwise undefined/null */
  size: {
    id: string;
    label: string;
    sortOrder: number;
    waist?: number | null;
    length?: number | null;
  };
  colour: { id: string; name: string; hex: string };
}

export interface Selection {
  sizeId: string | null;
  colourId: string | null;
  /** Jeans: waist and length are chosen separately; sizeId is set once both match a size. */
  waist?: number | null;
  length?: number | null;
}

/** True when every size is a waist + length size, so the shop shows two separate choices. */
export function isWaistLengthSizing(variants: SelectableVariant[]) {
  return (
    variants.length > 0 && variants.every((v) => v.size.waist != null && v.size.length != null)
  );
}

export function uniqueWaists(variants: SelectableVariant[]) {
  return [...new Set(variants.map((v) => v.size.waist!))].sort((a, b) => a - b);
}

export function uniqueLengths(variants: SelectableVariant[]) {
  return [...new Set(variants.map((v) => v.size.length!))].sort((a, b) => a - b);
}

/** Size id for a waist + length pair, if this product has that size. */
export function sizeIdFor(
  variants: SelectableVariant[],
  waist: number | null,
  length: number | null,
) {
  if (waist == null || length == null) return null;
  return variants.find((v) => v.size.waist === waist && v.size.length === length)?.size.id ?? null;
}

/** In stock for this waist, given the length and colour already chosen? */
export function waistAvailable(variants: SelectableVariant[], waist: number, sel: Selection) {
  return variants.some(
    (v) =>
      v.stock > 0 &&
      v.size.waist === waist &&
      (sel.length == null || v.size.length === sel.length) &&
      (sel.colourId === null || v.colour.id === sel.colourId),
  );
}

/** In stock for this length, given the waist and colour already chosen? */
export function lengthAvailable(variants: SelectableVariant[], length: number, sel: Selection) {
  return variants.some(
    (v) =>
      v.stock > 0 &&
      v.size.length === length &&
      (sel.waist == null || v.size.waist === sel.waist) &&
      (sel.colourId === null || v.colour.id === sel.colourId),
  );
}

/** Colour availability for jeans also respects a waist or length chosen on its own. */
export function colourAvailableFor(
  variants: SelectableVariant[],
  colourId: string,
  sel: Selection,
) {
  return variants.some(
    (v) =>
      v.stock > 0 &&
      v.colour.id === colourId &&
      (sel.sizeId === null || v.size.id === sel.sizeId) &&
      (sel.waist == null || v.size.waist === sel.waist) &&
      (sel.length == null || v.size.length === sel.length),
  );
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

/** Pre-select an option when there is only one choice (e.g. a one-size item or a single wash). */
export function initialSelection(variants: SelectableVariant[]): Selection {
  const sizes = uniqueSizes(variants);
  const colours = uniqueColours(variants);
  const selection: Selection = {
    sizeId: sizes.length === 1 ? sizes[0].id : null,
    colourId: colours.length === 1 ? colours[0].id : null,
  };
  if (isWaistLengthSizing(variants)) {
    const waists = uniqueWaists(variants);
    const lengths = uniqueLengths(variants);
    selection.waist = waists.length === 1 ? waists[0] : null;
    selection.length = lengths.length === 1 ? lengths[0] : null;
    selection.sizeId = sizeIdFor(variants, selection.waist, selection.length);
  }
  return selection;
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
