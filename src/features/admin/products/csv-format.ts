import { z } from "zod";
import { parsePoundsToPence, penceToPoundsInput } from "@/lib/money";
import { RISES, STRETCHES } from "@/features/catalog/jeans";

/**
 * Bulk CSV format: one row per variant (size + colour).
 * Product-level columns are read from the first row of each product_sku group,
 * so later rows for the same product may leave them blank.
 */
export const CSV_COLUMNS = [
  "product_sku",
  "name",
  "slug",
  "category_slug",
  "fit",
  "rise",
  "stretch",
  "fabric",
  "base_price",
  "sale_price",
  "description",
  "care_details",
  "tags",
  "is_new",
  "is_best_seller",
  "is_featured",
  "is_active",
  "size",
  "colour",
  "colour_hex",
  "variant_sku",
  "stock",
  "price_override",
  "image_urls",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type CsvRow = Record<CsvColumn, string>;

export const MAX_CSV_ROWS = 5000;

const yesNo = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v, ctx) => {
    if (v === "") return undefined;
    if (["yes", "y", "true", "1"].includes(v)) return true;
    if (["no", "n", "false", "0"].includes(v)) return false;
    ctx.addIssue({ code: "custom", message: "Use yes or no" });
    return z.NEVER;
  });

const pounds = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return undefined;
    const pence = parsePoundsToPence(v);
    if (pence === null) {
      ctx.addIssue({ code: "custom", message: `"${v}" is not a valid price` });
      return z.NEVER;
    }
    return pence;
  });

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v));

export const csvRowSchema = z.object({
  product_sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-]{0,59}$/, "product_sku: letters, numbers and hyphens only"),
  name: text(120),
  slug: text(80),
  category_slug: text(80),
  fit: text(40),
  rise: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return undefined;
      const match = RISES.find((r) => r.toLowerCase() === v.toLowerCase().replace(/ rise$/, ""));
      if (match) return match;
      ctx.addIssue({ code: "custom", message: "rise must be Low, Mid or High" });
      return z.NEVER;
    }),
  stretch: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return undefined;
      const match = STRETCHES.find((st) => st.toLowerCase() === v.toLowerCase());
      if (match) return match;
      ctx.addIssue({
        code: "custom",
        message: `stretch must be one of: ${STRETCHES.join(", ")}`,
      });
      return z.NEVER;
    }),
  fabric: text(80),
  base_price: pounds,
  sale_price: pounds,
  description: text(5000),
  care_details: text(2000),
  tags: text(500),
  is_new: yesNo,
  is_best_seller: yesNo,
  is_featured: yesNo,
  is_active: yesNo,
  size: z.string().trim().min(1, "size is required").max(30),
  colour: z.string().trim().min(1, "colour is required").max(40),
  colour_hex: z
    .string()
    .trim()
    .refine((v) => v === "" || /^#[0-9a-fA-F]{6}$/.test(v), "colour_hex must look like #1F4D3F")
    .transform((v) => (v === "" ? undefined : v.toUpperCase())),
  variant_sku: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (v) => v === "" || /^[A-Z0-9][A-Z0-9-]{0,59}$/.test(v),
      "variant_sku: letters, numbers and hyphens only",
    )
    .transform((v) => (v === "" ? undefined : v)),
  stock: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return 0;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 100000) {
        ctx.addIssue({ code: "custom", message: "stock must be a whole number" });
        return z.NEVER;
      }
      return n;
    }),
  price_override: pounds,
  image_urls: z
    .string()
    .trim()
    .transform((v) =>
      v === ""
        ? []
        : v
            .split("|")
            .map((u) => u.trim())
            .filter(Boolean),
    )
    .refine(
      (urls) => urls.every((u) => u.startsWith("https://res.cloudinary.com/")),
      "image_urls must be Cloudinary links separated by |",
    ),
});

export type ParsedCsvRow = z.output<typeof csvRowSchema>;

const bool = (v: boolean) => (v ? "yes" : "no");

export interface ExportVariant {
  product: {
    sku: string;
    name: string;
    slug: string;
    categorySlug: string;
    fit: string | null;
    rise: string | null;
    stretch: string | null;
    fabric: string | null;
    basePrice: number;
    salePrice: number | null;
    description: string;
    careDetails: string | null;
    tags: string[];
    isNew: boolean;
    isBestSeller: boolean;
    isFeatured: boolean;
    isActive: boolean;
    imageUrls: string[];
  };
  size: string;
  colour: string;
  colourHex: string;
  sku: string;
  stock: number;
  priceOverride: number | null;
}

/** Build export rows. Product-level fields are repeated on every row so the file is easy to edit. */
export function toCsvRows(variants: ExportVariant[]): CsvRow[] {
  return variants.map((v) => ({
    product_sku: v.product.sku,
    name: v.product.name,
    slug: v.product.slug,
    category_slug: v.product.categorySlug,
    fit: v.product.fit ?? "",
    rise: v.product.rise ?? "",
    stretch: v.product.stretch ?? "",
    fabric: v.product.fabric ?? "",
    base_price: penceToPoundsInput(v.product.basePrice),
    sale_price: penceToPoundsInput(v.product.salePrice),
    description: v.product.description,
    care_details: v.product.careDetails ?? "",
    tags: v.product.tags.join(", "),
    is_new: bool(v.product.isNew),
    is_best_seller: bool(v.product.isBestSeller),
    is_featured: bool(v.product.isFeatured),
    is_active: bool(v.product.isActive),
    size: v.size,
    colour: v.colour,
    colour_hex: v.colourHex,
    variant_sku: v.sku,
    stock: String(v.stock),
    price_override: penceToPoundsInput(v.priceOverride),
    image_urls: v.product.imageUrls.join("|"),
  }));
}
