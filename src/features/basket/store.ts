"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MAX_QUANTITY_PER_LINE } from "@/features/product/variants";

/**
 * A basket line as the browser knows it. Prices here are for display only;
 * the server re-reads prices and stock before any order is created.
 */
export interface BasketLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  size: string;
  colour: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
}

interface BasketState {
  lines: BasketLine[];
  drawerOpen: boolean;
  add: (line: BasketLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  /** Update prices/limits from a server quote and drop lines that no longer exist. */
  sync: (
    updates: { variantId: string; unitPrice: number; stock: number }[],
    missing: string[],
  ) => void;
  setDrawerOpen: (open: boolean) => void;
}

const clamp = (q: number, max: number) => Math.max(1, Math.min(q, max, MAX_QUANTITY_PER_LINE));

export const useBasket = create<BasketState>()(
  persist(
    (set) => ({
      lines: [],
      drawerOpen: false,
      add: (line) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          const lines = existing
            ? state.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, ...line, quantity: clamp(l.quantity + line.quantity, line.maxQuantity) }
                  : l,
              )
            : [...state.lines, { ...line, quantity: clamp(line.quantity, line.maxQuantity) }];
          return { lines, drawerOpen: true };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: clamp(quantity, l.maxQuantity) } : l,
          ),
        })),
      remove: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
      sync: (updates, missing) =>
        set((state) => {
          const byId = new Map(updates.map((u) => [u.variantId, u]));
          return {
            lines: state.lines
              .filter((l) => !missing.includes(l.variantId))
              .map((l) => {
                const u = byId.get(l.variantId);
                return u
                  ? {
                      ...l,
                      unitPrice: u.unitPrice,
                      maxQuantity: Math.max(1, Math.min(u.stock, MAX_QUANTITY_PER_LINE)),
                    }
                  : l;
              }),
          };
        }),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
    }),
    {
      name: "ym-basket",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

/** True after the first client render, so persisted basket data never causes a hydration mismatch. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function basketCount(lines: BasketLine[]) {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

export function basketSubtotal(lines: BasketLine[]) {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}
