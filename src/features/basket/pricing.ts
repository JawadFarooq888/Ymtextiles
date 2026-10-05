export interface DeliverySettings {
  standardDeliveryFee: number;
  expressDeliveryFee: number;
  freeDeliveryThreshold: number;
}

export type DeliveryMethod = "standard" | "express";

/** Delivery fee in pence. Standard delivery is free at or above the threshold (0 = always free). */
export function deliveryFee(
  subtotal: number,
  settings: DeliverySettings,
  method: DeliveryMethod = "standard",
): number {
  if (subtotal <= 0) return 0;
  if (method === "express") return settings.expressDeliveryFee;
  if (settings.freeDeliveryThreshold === 0 || subtotal >= settings.freeDeliveryThreshold) return 0;
  return settings.standardDeliveryFee;
}

export interface PricedLine {
  unitPrice: number;
  quantity: number;
}

export function orderTotals(
  lines: PricedLine[],
  settings: DeliverySettings,
  method: DeliveryMethod = "standard",
) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const fee = deliveryFee(subtotal, settings, method);
  return { subtotal, deliveryFee: fee, total: subtotal + fee };
}
