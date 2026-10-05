import "server-only";
import { db } from "@/lib/db";
import { orderTotals, type DeliveryMethod, type DeliverySettings } from "@/features/basket/pricing";
import { unitPrice } from "@/features/product/variants";

export interface BasketRequestLine {
  variantId: string;
  quantity: number;
}

export interface QuotedLine {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  size: string;
  colour: string;
  image: string | null;
  unitPrice: number;
  /** quantity requested by the customer */
  quantity: number;
  stock: number;
  /** false when the product/variant is gone, hidden, or out of stock */
  available: boolean;
  /** human message when the line needs attention */
  problem: string | null;
}

export interface BasketQuote {
  lines: QuotedLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** variant ids that no longer exist at all */
  missing: string[];
  ok: boolean;
}

/**
 * Re-read prices and stock from the database for the given basket lines. The
 * browser's copy of prices is never trusted for orders.
 */
export async function quoteBasket(
  request: BasketRequestLine[],
  settings: DeliverySettings,
  method: DeliveryMethod = "standard",
): Promise<BasketQuote> {
  const ids = [...new Set(request.map((l) => l.variantId))];
  const variants = await db.variant.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      sku: true,
      stock: true,
      isActive: true,
      priceOverride: true,
      size: { select: { label: true } },
      colour: { select: { name: true } },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
          isActive: true,
          category: { select: { isActive: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  // Merge duplicate lines for the same variant.
  const merged = new Map<string, number>();
  for (const l of request) merged.set(l.variantId, (merged.get(l.variantId) ?? 0) + l.quantity);

  const lines: QuotedLine[] = [];
  const missing: string[] = [];
  for (const [variantId, quantity] of merged) {
    const v = byId.get(variantId);
    if (!v) {
      missing.push(variantId);
      continue;
    }
    const sellable = v.isActive && v.product.isActive && v.product.category.isActive;
    let problem: string | null = null;
    if (!sellable) problem = "No longer available";
    else if (v.stock <= 0) problem = "Sold out";
    else if (quantity > v.stock) problem = `Only ${v.stock} left`;
    lines.push({
      variantId,
      productId: v.product.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      sku: v.sku,
      size: v.size.label,
      colour: v.colour.name,
      image: v.product.images[0]?.url ?? null,
      unitPrice: unitPrice(v.product, v),
      quantity,
      stock: v.stock,
      available: sellable && v.stock > 0,
      problem,
    });
  }

  const priced = lines.filter((l) => l.available);
  const totals = orderTotals(priced, settings, method);
  return {
    lines,
    ...totals,
    missing,
    ok: missing.length === 0 && lines.length > 0 && lines.every((l) => l.problem === null),
  };
}
