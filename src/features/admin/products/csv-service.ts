import "server-only";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import {
  CSV_COLUMNS,
  MAX_CSV_ROWS,
  csvRowSchema,
  toCsvRows,
  type ParsedCsvRow,
} from "@/features/admin/products/csv-format";
import { variantSku } from "@/features/admin/products/schema";
import { jeansSizeLabel, jeansSizeSortOrder } from "@/features/admin/attributes/schema";

export interface CsvImportSummary {
  productsCreated: number;
  productsUpdated: number;
  variantsSaved: number;
  sizesCreated: string[];
  coloursCreated: string[];
  errors: string[];
}

export async function exportProductsCsv(): Promise<string> {
  const variants = await db.variant.findMany({
    orderBy: [
      { product: { sku: "asc" } },
      { size: { sortOrder: "asc" } },
      { colour: { name: "asc" } },
    ],
    include: {
      size: true,
      colour: true,
      product: {
        include: {
          category: { select: { slug: true } },
          images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
        },
      },
    },
  });
  const rows = toCsvRows(
    variants.map((v) => ({
      product: {
        ...v.product,
        categorySlug: v.product.category.slug,
        imageUrls: v.product.images.map((i) => i.url),
      },
      size: v.size.label,
      colour: v.colour.name,
      colourHex: v.colour.hex,
      sku: v.sku,
      stock: v.stock,
      priceOverride: v.priceOverride,
    })),
  );
  return Papa.unparse({ fields: [...CSV_COLUMNS], data: rows });
}

/**
 * Import products from CSV. Non-destructive: products and variants are created or
 * updated by SKU; nothing missing from the file is deleted. Each product is saved in
 * its own transaction so one bad product does not block the rest.
 */
export async function importProductsCsv(csvText: string): Promise<CsvImportSummary> {
  const summary: CsvImportSummary = {
    productsCreated: 0,
    productsUpdated: 0,
    variantsSaved: 0,
    sizesCreated: [],
    coloursCreated: [],
    errors: [],
  };

  const parsed = Papa.parse<Record<string, string>>(csvText.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  for (const required of ["product_sku", "size", "colour"] as const) {
    if (!parsed.meta.fields?.includes(required)) {
      summary.errors.push(`Missing required column "${required}".`);
    }
  }
  if (summary.errors.length) return summary;
  if (parsed.data.length > MAX_CSV_ROWS) {
    summary.errors.push(`Too many rows (${parsed.data.length}). The limit is ${MAX_CSV_ROWS}.`);
    return summary;
  }

  // Validate rows; row numbers match the spreadsheet (header is row 1).
  const groups = new Map<string, { row: number; data: ParsedCsvRow }[]>();
  parsed.data.forEach((raw, index) => {
    const filled = Object.fromEntries(CSV_COLUMNS.map((c) => [c, raw[c] ?? ""]));
    const result = csvRowSchema.safeParse(filled);
    if (!result.success) {
      summary.errors.push(
        `Row ${index + 2}: ${result.error.issues.map((i) => i.message).join("; ")}`,
      );
      return;
    }
    const list = groups.get(result.data.product_sku) ?? [];
    list.push({ row: index + 2, data: result.data });
    groups.set(result.data.product_sku, list);
  });

  // Lookups (case-insensitive for sizes and colours).
  const [categories, sizes, colours] = await Promise.all([
    db.category.findMany({ select: { id: true, slug: true } }),
    db.size.findMany({ select: { id: true, label: true, sortOrder: true } }),
    db.colour.findMany({ select: { id: true, name: true } }),
  ]);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const sizeByLabel = new Map(sizes.map((s) => [s.label.toLowerCase(), s]));
  const colourByName = new Map(colours.map((c) => [c.name.toLowerCase(), c]));
  let nextSizeOrder = Math.max(0, ...sizes.map((s) => s.sortOrder)) + 1;

  for (const [productSku, rows] of groups) {
    const first = rows[0].data;
    const label = `Product ${productSku} (row ${rows[0].row})`;
    try {
      const existing = await db.product.findUnique({
        where: { sku: productSku },
        select: { id: true, _count: { select: { images: true } } },
      });

      const categoryId = first.category_slug ? categoryBySlug.get(first.category_slug) : undefined;
      if (first.category_slug && !categoryId) {
        throw new Error(`category_slug "${first.category_slug}" does not exist`);
      }
      if (!existing) {
        if (!first.name) throw new Error("name is required for a new product");
        if (!categoryId) throw new Error("category_slug is required for a new product");
        if (first.base_price === undefined)
          throw new Error("base_price is required for a new product");
      }
      if (
        first.sale_price !== undefined &&
        first.base_price !== undefined &&
        first.sale_price >= first.base_price
      ) {
        throw new Error("sale_price must be lower than base_price");
      }

      // Create any sizes and colours that don't exist yet.
      for (const { data } of rows) {
        if (!sizeByLabel.has(data.size.toLowerCase())) {
          // "W32 L30" becomes a waist/length size; anything else (e.g. "7-8Y") a plain size.
          const jeans = data.size.match(/^W\s*(\d+)\s*L\s*(\d+)$/i);
          const waist = jeans ? Number(jeans[1]) : null;
          const length = jeans ? Number(jeans[2]) : null;
          const size = await db.size.create({
            data:
              waist !== null && length !== null
                ? {
                    label: jeansSizeLabel(waist, length),
                    waist,
                    length,
                    sortOrder: jeansSizeSortOrder(waist, length),
                  }
                : { label: data.size, sortOrder: nextSizeOrder++ },
          });
          sizeByLabel.set(data.size.toLowerCase(), size);
          sizeByLabel.set(size.label.toLowerCase(), size);
          summary.sizesCreated.push(size.label);
        }
        if (!colourByName.has(data.colour.toLowerCase())) {
          const colour = await db.colour.create({
            data: { name: data.colour, hex: data.colour_hex ?? "#CCCCCC" },
          });
          colourByName.set(colour.name.toLowerCase(), colour);
          summary.coloursCreated.push(colour.name);
        }
      }

      const productFields = {
        ...(first.name !== undefined && { name: first.name }),
        ...(first.slug !== undefined && { slug: slugify(first.slug) }),
        ...(categoryId && { categoryId }),
        ...(first.fabric !== undefined && { fabric: first.fabric }),
        ...(first.fit !== undefined && { fit: first.fit }),
        ...(first.rise !== undefined && { rise: first.rise }),
        ...(first.stretch !== undefined && { stretch: first.stretch }),
        ...(first.base_price !== undefined && { basePrice: first.base_price }),
        ...(first.sale_price !== undefined && { salePrice: first.sale_price }),
        ...(first.description !== undefined && { description: first.description }),
        ...(first.care_details !== undefined && { careDetails: first.care_details }),
        ...(first.tags !== undefined && {
          tags: first.tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        }),
        ...(first.is_new !== undefined && { isNew: first.is_new }),
        ...(first.is_best_seller !== undefined && { isBestSeller: first.is_best_seller }),
        ...(first.is_featured !== undefined && { isFeatured: first.is_featured }),
        ...(first.is_active !== undefined && { isActive: first.is_active }),
      };

      await db.$transaction(
        async (tx) => {
          const product = existing
            ? await tx.product.update({ where: { id: existing.id }, data: productFields })
            : await tx.product.create({
                data: {
                  ...productFields,
                  sku: productSku,
                  name: first.name!,
                  slug: slugify(first.slug ?? first.name!),
                  categoryId: categoryId!,
                  basePrice: first.base_price!,
                },
              });

          // Images are only added to products that have none, so manual uploads are never replaced.
          if ((existing?._count.images ?? 0) === 0 && first.image_urls.length > 0) {
            await tx.productImage.createMany({
              data: first.image_urls.map((url, sortOrder) => ({
                productId: product.id,
                url,
                alt: product.name,
                sortOrder,
              })),
            });
          }

          for (const { data } of rows) {
            const size = sizeByLabel.get(data.size.toLowerCase())!;
            const colour = colourByName.get(data.colour.toLowerCase())!;
            const sku = data.variant_sku ?? variantSku(productSku, size.label, colour.name);
            await tx.variant.upsert({
              where: {
                productId_sizeId_colourId: {
                  productId: product.id,
                  sizeId: size.id,
                  colourId: colour.id,
                },
              },
              update: {
                sku,
                stock: data.stock,
                ...(data.price_override !== undefined && { priceOverride: data.price_override }),
              },
              create: {
                productId: product.id,
                sizeId: size.id,
                colourId: colour.id,
                sku,
                stock: data.stock,
                priceOverride: data.price_override ?? null,
              },
            });
          }
        },
        { timeout: 30_000, maxWait: 10_000 },
      );

      if (existing) summary.productsUpdated++;
      else summary.productsCreated++;
      summary.variantsSaved += rows.length;
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message =
        code === "P2002"
          ? "a slug or SKU in this product is already used by another product"
          : error instanceof Error && !code
            ? error.message
            : "could not be saved";
      if (code && code !== "P2002") console.error(`[csv] ${label}`, error);
      summary.errors.push(`${label}: ${message}`);
    }
  }

  return summary;
}
