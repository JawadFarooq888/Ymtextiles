import { penceToPoundsInput } from "@/lib/money";
import type { ProductFormValues } from "@/features/admin/products/schema";
import type { getProductForEdit } from "@/features/admin/products/service";

type EditableProduct = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  careDetails: "",
  fabric: "",
  pieces: "",
  type: "STITCHED",
  basePrice: "",
  salePrice: "",
  categoryId: "",
  sizeChartId: "",
  tags: "",
  isFeatured: false,
  isBestSeller: false,
  isNew: true,
  isActive: true,
  seoTitle: "",
  seoDescription: "",
  images: [],
  variants: [],
};

export function toProductFormValues(p: EditableProduct): ProductFormValues {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    careDetails: p.careDetails ?? "",
    fabric: p.fabric ?? "",
    pieces: p.pieces ? (String(p.pieces) as "1" | "2" | "3") : "",
    type: p.type,
    basePrice: penceToPoundsInput(p.basePrice),
    salePrice: penceToPoundsInput(p.salePrice),
    categoryId: p.categoryId,
    sizeChartId: p.sizeChartId ?? "",
    tags: p.tags.join(", "),
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNew: p.isNew,
    isActive: p.isActive,
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      publicId: img.publicId,
      alt: img.alt,
      colourId: img.colourId ?? "",
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      sizeId: v.sizeId,
      colourId: v.colourId,
      sku: v.sku,
      stock: String(v.stock),
      priceOverride: penceToPoundsInput(v.priceOverride),
      isActive: v.isActive,
    })),
  };
}
