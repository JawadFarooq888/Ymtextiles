// All money is stored as integer pence.

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** 4500 -> "£45.00" */
export function formatPence(pence: number): string {
  return gbp.format(pence / 100);
}

/** 4500 -> "45.00", null -> "" (for form inputs) */
export function penceToPoundsInput(pence: number | null | undefined): string {
  return pence == null ? "" : (pence / 100).toFixed(2);
}

/**
 * Parse a pounds string typed by a person into pence without floating-point maths.
 * "45" -> 4500, "£45.5" -> 4550, "1,200.99" -> 120099. Returns null when invalid.
 */
export function parsePoundsToPence(value: string): number | null {
  const cleaned = value.trim().replace(/^£/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Whole-number percentage saved, e.g. (4500, 3600) -> 20 */
export function percentOff(basePence: number, salePence: number): number {
  if (basePence <= 0 || salePence >= basePence) return 0;
  return Math.round(((basePence - salePence) / basePence) * 100);
}
