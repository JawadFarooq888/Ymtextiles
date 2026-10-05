/** Everything the shop needs to list, filter and sort a product, kept small so the whole catalogue caches as one entry. */
export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  sku: string;
  categoryId: string;
  fabric: string | null;
  pieces: number | null;
  type: "STITCHED" | "UNSTITCHED";
  basePrice: number;
  salePrice: number | null;
  /** salePrice ?? basePrice, in pence */
  price: number;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  tags: string[];
  /** ISO string (cache entries are JSON, so Dates would not survive) */
  createdAt: string;
  images: { url: string; alt: string }[];
  /** [sizeId, colourId, stock] for each active variant */
  variants: [string, string, number][];
  inStock: boolean;
}

export interface CatalogSize {
  id: string;
  label: string;
  sortOrder: number;
}

export interface CatalogColour {
  id: string;
  name: string;
  hex: string;
}

export interface CatalogIndex {
  products: CatalogProduct[];
  sizes: CatalogSize[];
  colours: CatalogColour[];
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  parentId: string | null;
  children: NavCategory[];
}
