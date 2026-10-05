import { describe, expect, it } from "vitest";
import { formatPence, parsePoundsToPence, penceToPoundsInput, percentOff } from "@/lib/money";
import { deliveryFee, orderTotals } from "@/features/basket/pricing";

describe("money", () => {
  it("formats pence as GBP", () => {
    expect(formatPence(4500)).toBe("£45.00");
    expect(formatPence(5)).toBe("£0.05");
    expect(formatPence(123456)).toBe("£1,234.56");
  });

  it("parses typed pounds without floating point errors", () => {
    expect(parsePoundsToPence("45")).toBe(4500);
    expect(parsePoundsToPence("£45.5")).toBe(4550);
    expect(parsePoundsToPence("0.29")).toBe(29);
    expect(parsePoundsToPence("1,200.99")).toBe(120099);
    expect(parsePoundsToPence("abc")).toBeNull();
    expect(parsePoundsToPence("1.234")).toBeNull();
    expect(parsePoundsToPence("-5")).toBeNull();
  });

  it("round-trips form values", () => {
    expect(penceToPoundsInput(4550)).toBe("45.50");
    expect(penceToPoundsInput(null)).toBe("");
  });

  it("computes percent off", () => {
    expect(percentOff(4500, 3600)).toBe(20);
    expect(percentOff(4500, 4500)).toBe(0);
  });
});

describe("delivery and order totals", () => {
  const settings = {
    standardDeliveryFee: 399,
    expressDeliveryFee: 699,
    freeDeliveryThreshold: 7500,
  };

  it("charges standard delivery below the threshold and nothing at or above it", () => {
    expect(deliveryFee(7499, settings)).toBe(399);
    expect(deliveryFee(7500, settings)).toBe(0);
  });

  it("always charges express", () => {
    expect(deliveryFee(10000, settings, "express")).toBe(699);
  });

  it("treats a 0 threshold as always-free standard delivery, and empty baskets as free", () => {
    expect(deliveryFee(100, { ...settings, freeDeliveryThreshold: 0 })).toBe(0);
    expect(deliveryFee(0, settings)).toBe(0);
  });

  it("totals lines plus delivery", () => {
    expect(
      orderTotals(
        [
          { unitPrice: 4500, quantity: 1 },
          { unitPrice: 1000, quantity: 2 },
        ],
        settings,
      ),
    ).toEqual({ subtotal: 6500, deliveryFee: 399, total: 6899 });
  });
});
