import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { FIT_SUGGESTIONS } from "@/features/catalog/jeans";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import type { ProductData } from "@/features/admin/products/schema";

export const ADMIN_PRODUCTS_PAGE_SIZE = 25;

export interface AdminProductFilters {
  q?: string;
  categoryId?: string;
  status?: "active" | "inactive" | "low-stock";
  page?: number;
}

export async function listProductsForAdmin(filters: AdminProductFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const settings = await db.settings.findUnique({
    where: { id: 1 },
    select: { lowStockThreshold: true },
  });
  const lowStock = settings?.lowStockThreshold ?? 3;

  const where: Prisma.ProductWhereInput = {
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { sku: { contains: filters.q, mode: "insensitive" } },
            { variants: { some: { sku: { contains: filters.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status === "active" ? { isActive: true } : {}),
    ...(filters.status === "inactive" ? { isActive: false } : {}),
    ...(filters.status === "low-stock"
      ? { variants: { some: { isActive: true, stock: { lte: lowStock } } } }
      : {}),
  };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE,
      take: ADMIN_PRODUCTS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        basePrice: true,
        salePrice: true,
        isActive: true,
        isNew: true,
        isBestSeller: true,
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
        variants: { select: { stock: true, isActive: true } },
      },
    }),
  ]);

  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PAGE_SIZE)),
    products: products.map(({ variants, ...p }) => ({
      ...p,
      totalStock: variants.filter((v) => v.isActive).reduce((sum, v) => sum + v.stock, 0),
      variantCount: variants.length,
      lowStock: variants.some((v) => v.isActive && v.stock <= lowStock),
    })),
  };
}

export function getProductForEdit(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        include: { size: true, colour: true },
        orderBy: [{ size: { sortOrder: "asc" } }, { colour: { name: "asc" } }],
      },
    },
  });
}

export async function getProductFormOptions() {
  const [categories, sizes, colours, sizeCharts, fabrics, fits] = await Promise.all([
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    db.size.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, label: true, waist: true, length: true },
    }),
    db.colour.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, hex: true } }),
    db.sizeChart.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({
      where: { fabric: { not: null } },
      distinct: ["fabric"],
      select: { fabric: true },
    }),
    db.product.findMany({
      where: { fit: { not: null } },
      distinct: ["fit"],
      select: { fit: true },
    }),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const label = (c: (typeof categories)[number]): string => {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    return parent ? `${label(parent)} > ${c.name}` : c.name;
  };
  return {
    categories: categories
      .map((c) => ({ id: c.id, label: label(c) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    sizes,
    colours,
    sizeCharts,
    fabrics: fabrics
      .map((f) => f.fabric)
      .filter((f): f is string => !!f)
      .sort(),
    fits: [
      ...new Set([...FIT_SUGGESTIONS, ...fits.map((f) => f.fit).filter((f): f is string => !!f)]),
    ],
  };
}

/**
 * Create or update a product with its images and variants in one transaction.
 * Images and variants missing from the payload are removed.
 */
export async function saveProduct(data: ProductData) {
  const { id, images, variants, ...fields } = data;
  const previous = id
    ? await db.product.findUnique({ where: { id }, select: { slug: true } })
    : null;

  const { product, removedPublicIds } = await db.$transaction(
    async (tx) => {
      const product = id
        ? await tx.product.update({ where: { id }, data: fields })
        : await tx.product.create({ data: fields });

      // Images
      const keptImageIds = images.flatMap((img) => (img.id ? [img.id] : []));
      const removedImages = await tx.productImage.findMany({
        where: { productId: product.id, id: { notIn: keptImageIds } },
        select: { publicId: true },
      });
      await tx.productImage.deleteMany({
        where: { productId: product.id, id: { notIn: keptImageIds } },
      });
      for (const [sortOrder, { id: imageId, ...img }] of images.entries()) {
        if (imageId) {
          await tx.productImage.update({
            where: { id: imageId, productId: product.id },
            data: { ...img, sortOrder },
          });
        } else {
          await tx.productImage.create({ data: { ...img, sortOrder, productId: product.id } });
        }
      }

      // Variants
      const keptVariantIds = variants.flatMap((v) => (v.id ? [v.id] : []));
      await tx.variant.deleteMany({
        where: { productId: product.id, id: { notIn: keptVariantIds } },
      });
      for (const { id: variantId, ...v } of variants) {
        if (variantId) {
          await tx.variant.update({ where: { id: variantId, productId: product.id }, data: v });
        }
      }
      const newVariants = variants.filter((v) => !v.id);
      if (newVariants.length > 0) {
        await tx.variant.createMany({
          data: newVariants.map((v) => ({
            productId: product.id,
            sizeId: v.sizeId,
            colourId: v.colourId,
            sku: v.sku,
            stock: v.stock,
            priceOverride: v.priceOverride,
            isActive: v.isActive,
          })),
        });
      }

      return {
        product,
        removedPublicIds: removedImages.flatMap((i) => (i.publicId ? [i.publicId] : [])),
      };
    },
    { timeout: 30_000, maxWait: 10_000 },
  );

  await Promise.all(removedPublicIds.map(deleteCloudinaryImage));
  return { id: product.id, slug: product.slug, previousSlug: previous?.slug ?? null };
}

export async function deleteProduct(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    select: { slug: true, images: { select: { publicId: true } } },
  });
  if (!product) return null;
  // Past order items keep their snapshots; their product link becomes null.
  await db.product.delete({ where: { id } });
  await Promise.all(
    product.images.flatMap((i) => (i.publicId ? [deleteCloudinaryImage(i.publicId)] : [])),
  );
  return product.slug;
}
