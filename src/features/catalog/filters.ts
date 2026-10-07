import type { CatalogIndex, CatalogProduct, CatalogSize } from "@/features/catalog/types";

export const PAGE_SIZE = 24;

export const SORTS = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "best-sellers": "Best sellers",
} as const;
export type SortKey = keyof typeof SORTS;

export interface Filters {
  waists: number[]; // inches
  lengths: number[]; // inches
  sizes: string[]; // ids of sizes without waist/length (e.g. kids ages)
  colours: string[]; // colour (wash) ids
  fits: string[];
  rises: string[];
  stretches: string[];
  minPrice: number | null; // pence
  maxPrice: number | null; // pence
  inStock: boolean;
  sort: SortKey;
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function numbers(value: string | string[] | undefined): number[] {
  return list(value)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0 && n < 100);
}

function poundsParam(value: string | string[] | undefined): number | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** Read filters from URL search params. Unknown or malformed values are ignored. */
export function parseFilters(sp: SearchParams): Filters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]);
  const sort = one("sort");
  const page = Number(one("page"));
  return {
    waists: numbers(sp.waist),
    lengths: numbers(sp.length),
    sizes: list(sp.size),
    colours: list(sp.colour),
    fits: list(sp.fit),
    rises: list(sp.rise),
    stretches: list(sp.stretch),
    minPrice: poundsParam(sp.min),
    maxPrice: poundsParam(sp.max),
    inStock: one("instock") === "1",
    sort: sort && sort in SORTS ? (sort as SortKey) : "newest",
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}

/** Build a query string for the given filters (used by links and the filter form). */
export function filtersToQuery(f: Filters, overrides: Partial<Filters> = {}): string {
  const merged = { ...f, ...overrides };
  const params = new URLSearchParams();
  if (merged.waists.length) params.set("waist", merged.waists.join(","));
  if (merged.lengths.length) params.set("length", merged.lengths.join(","));
  if (merged.sizes.length) params.set("size", merged.sizes.join(","));
  if (merged.colours.length) params.set("colour", merged.colours.join(","));
  if (merged.fits.length) params.set("fit", merged.fits.join(","));
  if (merged.rises.length) params.set("rise", merged.rises.join(","));
  if (merged.stretches.length) params.set("stretch", merged.stretches.join(","));
  if (merged.minPrice !== null) params.set("min", String(merged.minPrice / 100));
  if (merged.maxPrice !== null) params.set("max", String(merged.maxPrice / 100));
  if (merged.inStock) params.set("instock", "1");
  if (merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.page > 1) params.set("page", String(merged.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const CLEARED_FILTERS: Partial<Filters> = {
  waists: [],
  lengths: [],
  sizes: [],
  colours: [],
  fits: [],
  rises: [],
  stretches: [],
  minPrice: null,
  maxPrice: null,
  inStock: false,
};

export function activeFilterCount(f: Filters): number {
  return (
    f.waists.length +
    f.lengths.length +
    f.sizes.length +
    f.colours.length +
    f.fits.length +
    f.rises.length +
    f.stretches.length +
    (f.minPrice !== null || f.maxPrice !== null ? 1 : 0) +
    (f.inStock ? 1 : 0)
  );
}

/**
 * A product matches when one in-stock variant satisfies every size and colour filter
 * at once (e.g. W32 and L30 and Black), not when different variants match each part.
 */
function matchesVariant(
  p: CatalogProduct,
  f: Filters,
  sizeById: Map<string, CatalogSize>,
): boolean {
  if (!f.waists.length && !f.lengths.length && !f.sizes.length && !f.colours.length) return true;
  return p.variants.some(([sizeId, colourId, stock]) => {
    if (stock <= 0) return false;
    if (f.colours.length && !f.colours.includes(colourId)) return false;
    const size = sizeById.get(sizeId);
    if (!size) return false;
    const sizeFiltered = f.waists.length || f.lengths.length || f.sizes.length;
    if (!sizeFiltered) return true;
    if (f.sizes.includes(sizeId)) return true;
    if (size.waist === null) return false;
    return (
      (!f.waists.length || f.waists.includes(size.waist)) &&
      (!f.lengths.length || (size.length !== null && f.lengths.includes(size.length))) &&
      (f.waists.length > 0 || f.lengths.length > 0)
    );
  });
}

function oneOf(value: string | null, wanted: string[]) {
  return !wanted.length || (value !== null && wanted.includes(value));
}

function matches(p: CatalogProduct, f: Filters, sizeById: Map<string, CatalogSize>): boolean {
  if (!matchesVariant(p, f, sizeById)) return false;
  if (!oneOf(p.fit, f.fits) || !oneOf(p.rise, f.rises) || !oneOf(p.stretch, f.stretches)) {
    return false;
  }
  if (f.minPrice !== null && p.price < f.minPrice) return false;
  if (f.maxPrice !== null && p.price > f.maxPrice) return false;
  if (f.inStock && !p.inStock) return false;
  return true;
}

export function sortProducts(products: CatalogProduct[], sort: SortKey): CatalogProduct[] {
  const sorted = [...products];
  const newest = (a: CatalogProduct, b: CatalogProduct) => b.createdAt.localeCompare(a.createdAt);
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price || newest(a, b));
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price || newest(a, b));
    case "best-sellers":
      return sorted.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || newest(a, b));
    default:
      return sorted.sort(newest);
  }
}

export interface FacetOptions {
  waists: number[];
  lengths: number[];
  /** sizes that are not waist/length (e.g. kids ages) */
  otherSizes: { id: string; label: string }[];
  colours: { id: string; name: string; hex: string }[];
  fits: string[];
  rises: string[];
  stretches: string[];
  priceRange: { min: number; max: number } | null;
}

const RISE_ORDER = ["Low", "Mid", "High"];

/** Filter options that exist within the collection (before filters are applied). */
export function facetOptions(scope: CatalogProduct[], index: CatalogIndex): FacetOptions {
  const sizeById = new Map(index.sizes.map((s) => [s.id, s]));
  const waists = new Set<number>();
  const lengths = new Set<number>();
  const otherSizeIds = new Set<string>();
  const colourIds = new Set<string>();
  const fits = new Set<string>();
  const rises = new Set<string>();
  const stretches = new Set<string>();
  let min = Infinity;
  let max = 0;
  for (const p of scope) {
    for (const [sizeId, colourId] of p.variants) {
      colourIds.add(colourId);
      const size = sizeById.get(sizeId);
      if (size?.waist != null) {
        waists.add(size.waist);
        if (size.length != null) lengths.add(size.length);
      } else if (size) {
        otherSizeIds.add(size.id);
      }
    }
    if (p.fit) fits.add(p.fit);
    if (p.rise) rises.add(p.rise);
    if (p.stretch) stretches.add(p.stretch);
    min = Math.min(min, p.price);
    max = Math.max(max, p.price);
  }
  return {
    waists: [...waists].sort((a, b) => a - b),
    lengths: [...lengths].sort((a, b) => a - b),
    otherSizes: index.sizes
      .filter((s) => otherSizeIds.has(s.id))
      .map((s) => ({ id: s.id, label: s.label })),
    colours: index.colours.filter((c) => colourIds.has(c.id)),
    fits: [...fits].sort(),
    rises: [...rises].sort(
      (a, b) => (RISE_ORDER.indexOf(a) + 1 || 99) - (RISE_ORDER.indexOf(b) + 1 || 99),
    ),
    stretches: [...stretches].sort(),
    priceRange: scope.length ? { min, max } : null,
  };
}

export function applyFilters(scope: CatalogProduct[], f: Filters, index: CatalogIndex) {
  const sizeById = new Map(index.sizes.map((s) => [s.id, s]));
  const filtered = sortProducts(
    scope.filter((p) => matches(p, f, sizeById)),
    f.sort,
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(f.page, pageCount);
  return {
    total: filtered.length,
    page,
    pageCount,
    products: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}
