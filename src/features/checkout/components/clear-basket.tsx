"use client";

import { useEffect } from "react";
import { useBasket } from "@/features/basket/store";

/** Empties the basket once payment has succeeded. */
export function ClearBasket() {
  const clear = useBasket((s) => s.clear);
  useEffect(() => clear(), [clear]);
  return null;
}
