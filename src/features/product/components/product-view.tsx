"use client";

import { useState } from "react";
import { Price } from "@/features/catalog/components/price";
import { ProductGallery, type GalleryImage } from "@/features/product/components/product-gallery";
import { VariantSelector } from "@/features/product/components/variant-selector";
import {
  findVariant,
  initialSelection,
  maxQuantity,
  unitPrice,
  type SelectableVariant,
  type Selection,
} from "@/features/product/variants";
import { formatPence } from "@/lib/money";

export interface ProductViewData {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  images: GalleryImage[];
  variants: SelectableVariant[];
}

export interface PurchaseState {
  selection: Selection;
  variant: SelectableVariant | null;
  quantity: number;
  unitPrice: number;
}

/**
 * Client part of the product page: gallery, price, variant selector and stock message.
 * `renderActions` receives the current selection (used for basket and WhatsApp buttons).
 */
export function ProductView({
  product,
  lowStockThreshold,
  header,
  sizeChartTrigger,
  renderActions,
  children,
}: {
  product: ProductViewData;
  lowStockThreshold: number;
  header: React.ReactNode;
  sizeChartTrigger?: React.ReactNode;
  renderActions?: (state: PurchaseState) => React.ReactNode;
  children?: React.ReactNode;
}) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(product.variants));
  const [quantity, setQuantity] = useState(1);
  const variant = findVariant(product.variants, selection);
  const max = maxQuantity(variant);
  const qty = Math.max(1, Math.min(quantity, max || 1));
  const price = unitPrice(product, variant);
  const anyStock = product.variants.some((v) => v.stock > 0);

  let stockMessage: { text: string; tone: "ok" | "low" | "out" } | null = null;
  if (!anyStock) stockMessage = { text: "Sold out", tone: "out" };
  else if (variant && variant.stock <= 0)
    stockMessage = { text: "Sold out in this size and colour", tone: "out" };
  else if (variant && variant.stock <= lowStockThreshold)
    stockMessage = { text: `Only ${variant.stock} left`, tone: "low" };
  else if (variant) stockMessage = { text: "In stock", tone: "ok" };

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
      <ProductGallery
        images={product.images}
        colourId={selection.colourId}
        productName={product.name}
      />
      <div className="md:sticky md:top-32 md:self-start">
        {header}
        <div className="mt-3">
          {variant?.priceOverride != null ? (
            <p className="text-2xl font-medium text-brand-ink">{formatPence(price)}</p>
          ) : (
            <Price
              basePrice={product.basePrice}
              salePrice={product.salePrice}
              size="lg"
              showPercent
            />
          )}
          <p className="mt-1 text-xs text-muted-foreground">Price includes VAT.</p>
        </div>

        <div className="mt-8">
          <VariantSelector
            variants={product.variants}
            selection={selection}
            onChange={(next) => {
              setSelection(next);
              setQuantity(1);
            }}
            quantity={qty}
            maxQuantity={max || 1}
            onQuantityChange={setQuantity}
            sizeChartTrigger={sizeChartTrigger}
          />
        </div>

        <p
          aria-live="polite"
          className={
            stockMessage?.tone === "low"
              ? "mt-4 text-sm font-medium text-brand-sale"
              : stockMessage?.tone === "out"
                ? "mt-4 text-sm font-medium text-muted-foreground"
                : "mt-4 text-sm text-primary"
          }
        >
          {stockMessage?.text ?? " "}
        </p>

        {renderActions ? (
          <div className="mt-4">
            {renderActions({ selection, variant, quantity: qty, unitPrice: price })}
          </div>
        ) : null}

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
