import type { CatalogIndex, CatalogProduct } from "@/features/catalog/types";

export const PAGE_SIZE = 24;

export const SORTS = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "best-sellers": "Best sellers",
} as const;
export type SortKey = keyof typeof SORTS;

export interface Filters {
  sizes: string[]; // size ids
  colours: string[]; // colour ids
  fabrics: string[];
  pieces: number[];
  type: "STITCHED" | "UNSTITCHED" | null;
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
  const type = one("type")?.toUpperCase();
  const page = Number(one("page"));
  return {
    sizes: list(sp.size),
    colours: list(sp.colour),
    fabrics: list(sp.fabric),
    pieces: list(sp.pieces)
      .map(Number)
      .filter((n) => [1, 2, 3].includes(n)),
    type: type === "STITCHED" || type === "UNSTITCHED" ? type : null,
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
  if (merged.sizes.length) params.set("size", merged.sizes.join(","));
  if (merged.colours.length) params.set("colour", merged.colours.join(","));
  if (merged.fabrics.length) params.set("fabric", merged.fabrics.join(","));
  if (merged.pieces.length) params.set("pieces", merged.pieces.join(","));
  if (merged.type) params.set("type", merged.type.toLowerCase());
  if (merged.minPrice !== null) params.set("min", String(merged.minPrice / 100));
  if (merged.maxPrice !== null) params.set("max", String(merged.maxPrice / 100));
  if (merged.inStock) params.set("instock", "1");
  if (merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.page > 1) params.set("page", String(merged.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function activeFilterCount(f: Filters): number {
  return (
    f.sizes.length +
    f.colours.length +
    f.fabrics.length +
    f.pieces.length +
    (f.type ? 1 : 0) +
    (f.minPrice !== null || f.maxPrice !== null ? 1 : 0) +
    (f.inStock ? 1 : 0)
  );
}

function matchesVariant(p: CatalogProduct, f: Filters): boolean {
  if (!f.sizes.length && !f.colours.length) return true;
  return p.variants.some(
    ([sizeId, colourId, stock]) =>
      stock > 0 &&
      (!f.sizes.length || f.sizes.includes(sizeId)) &&
      (!f.colours.length || f.colours.includes(colourId)),
  );
}

function matches(p: CatalogProduct, f: Filters): boolean {
  if (!matchesVariant(p, f)) return false;
  if (f.fabrics.length && !(p.fabric && f.fabrics.includes(p.fabric))) return false;
  if (f.pieces.length && !(p.pieces && f.pieces.includes(p.pieces))) return false;
  if (f.type && p.type !== f.type) return false;
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
  sizes: { id: string; label: string }[];
  colours: { id: string; name: string; hex: string }[];
  fabrics: string[];
  pieces: number[];
  types: ("STITCHED" | "UNSTITCHED")[];
  priceRange: { min: number; max: number } | null;
}

/** Filter options that exist within the collection (before filters are applied). */
export function facetOptions(scope: CatalogProduct[], index: CatalogIndex): FacetOptions {
  const sizeIds = new Set<string>();
  const colourIds = new Set<string>();
  const fabrics = new Set<string>();
  const pieces = new Set<number>();
  const types = new Set<"STITCHED" | "UNSTITCHED">();
  let min = Infinity;
  let max = 0;
  for (const p of scope) {
    for (const [s, c] of p.variants) {
      sizeIds.add(s);
      colourIds.add(c);
    }
    if (p.fabric) fabrics.add(p.fabric);
    if (p.pieces) pieces.add(p.pieces);
    types.add(p.type);
    min = Math.min(min, p.price);
    max = Math.max(max, p.price);
  }
  return {
    sizes: index.sizes.filter((s) => sizeIds.has(s.id)),
    colours: index.colours.filter((c) => colourIds.has(c.id)),
    fabrics: [...fabrics].sort(),
    pieces: [...pieces].sort(),
    types: [...types].sort(),
    priceRange: scope.length ? { min, max } : null,
  };
}

export function applyFilters(scope: CatalogProduct[], f: Filters) {
  const filtered = sortProducts(
    scope.filter((p) => matches(p, f)),
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
