import { z } from "zod";
import {
  optionalText,
  poundsOptional,
  poundsRequired,
  slugSchema,
} from "@/features/admin/zod-helpers";

const emptyToNull = z.string().transform((v) => (v === "" ? null : v));

export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z
    .string()
    .url()
    .refine(
      (v) => v.startsWith("https://res.cloudinary.com/"),
      "Images must be uploaded to Cloudinary",
    ),
  publicId: z.string().max(300).nullable(),
  alt: z.string().trim().max(200),
  colourId: emptyToNull,
});

export const skuSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Required")
  .max(60)
  .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Use letters, numbers and hyphens only");

export const variantSchema = z.object({
  id: z.string().optional(),
  sizeId: z.string().min(1),
  colourId: z.string().min(1),
  sku: skuSchema,
  stock: z.coerce.number().int("Whole numbers only").min(0).max(100000),
  priceOverride: poundsOptional,
  isActive: z.boolean(),
});

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Required").max(120),
    slug: slugSchema,
    sku: skuSchema,
    description: z.string().trim().max(5000),
    careDetails: optionalText(2000),
    fabric: optionalText(80),
    fit: optionalText(40),
    rise: z.enum(["", "Low", "Mid", "High"]).transform((v) => (v === "" ? null : v)),
    stretch: z
      .enum(["", "No stretch", "Comfort stretch", "Super stretch"])
      .transform((v) => (v === "" ? null : v)),
    pieces: z.enum(["", "1", "2", "3"]).transform((v) => (v === "" ? null : Number(v))),
    type: z.enum(["STITCHED", "UNSTITCHED"]),
    basePrice: poundsRequired,
    salePrice: poundsOptional,
    categoryId: z.string().min(1, "Choose a category"),
    sizeChartId: emptyToNull,
    tags: z
      .string()
      .max(500)
      .transform((v) =>
        Array.from(
          new Set(
            v
              .split(",")
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean),
          ),
        ),
      ),
    isFeatured: z.boolean(),
    isBestSeller: z.boolean(),
    isNew: z.boolean(),
    isActive: z.boolean(),
    seoTitle: optionalText(70),
    seoDescription: optionalText(160),
    images: z.array(productImageSchema).max(20, "Up to 20 images"),
    variants: z.array(variantSchema).max(300, "Up to 300 variants"),
  })
  .superRefine((p, ctx) => {
    if (p.salePrice !== null && p.salePrice >= p.basePrice) {
      ctx.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "Sale price must be lower than the regular price",
      });
    }
    const combos = new Set<string>();
    const skus = new Set<string>();
    p.variants.forEach((v, i) => {
      const combo = `${v.sizeId}:${v.colourId}`;
      if (combos.has(combo)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", i, "sizeId"],
          message: "This size and colour combination is listed twice",
        });
      }
      combos.add(combo);
      if (skus.has(v.sku)) {
        ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "Duplicate SKU" });
      }
      skus.add(v.sku);
    });
  });

export type ProductFormValues = z.input<typeof productSchema>;
export type ProductData = z.output<typeof productSchema>;

/** Short code used in variant SKUs, e.g. "Black" -> "BLC", "Light Blue" -> "LGH". */
export function attributeCode(label: string): string {
  const clean = label.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean || "X";
  const consonants = clean[0] + clean.slice(1).replace(/[AEIOU]/g, "");
  return (consonants.length >= 3 ? consonants : clean).slice(0, 3);
}

/** "W32 L30" -> "W32L30"; other sizes use the 3-letter code. */
function sizeCode(label: string): string {
  const jeans = label
    .trim()
    .toUpperCase()
    .match(/^W\s*(\d+)\s*L\s*(\d+)$/);
  return jeans ? `W${jeans[1]}L${jeans[2]}` : attributeCode(label);
}

export function variantSku(productSku: string, sizeLabel: string, colourName: string): string {
  return `${productSku}-${sizeCode(sizeLabel)}-${attributeCode(colourName)}`.toUpperCase();
}
