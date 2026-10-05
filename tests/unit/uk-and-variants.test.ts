import { describe, expect, it } from "vitest";
import { normalisePhone, normaliseUkPostcode } from "@/lib/uk";
import {
  colourAvailable,
  findVariant,
  initialSelection,
  maxQuantity,
  sizeAvailable,
  unitPrice,
  type SelectableVariant,
} from "@/features/product/variants";
import { canTransition } from "@/features/orders/status";
import { attributeCode, variantSku } from "@/features/admin/products/schema";

describe("UK postcode", () => {
  it.each([
    ["sw1a1aa", "SW1A 1AA"],
    ["B1 1AA", "B1 1AA"],
    ["m11ae", "M1 1AE"],
    ["EC1A 1BB", "EC1A 1BB"],
    ["gir0aa", "GIR 0AA"],
  ])("accepts %s", (input, expected) => expect(normaliseUkPostcode(input)).toBe(expected));

  it.each(["", "12345", "ABC", "SW1A 1A", "Q1 1AA"])("rejects %s", (input) =>
    expect(normaliseUkPostcode(input)).toBeNull(),
  );
});

describe("phone", () => {
  it("normalises UK formats to international digits", () => {
    expect(normalisePhone("07123 456789")).toBe("447123456789");
    expect(normalisePhone("+44 7123 456789")).toBe("447123456789");
    expect(normalisePhone("0044 7123 456789")).toBe("447123456789");
  });
  it("accepts other countries with a + prefix", () => {
    expect(normalisePhone("+92 300 1234567")).toBe("923001234567");
  });
  it("rejects nonsense", () => {
    expect(normalisePhone("123")).toBeNull();
    expect(normalisePhone("07123")).toBeNull();
  });
});

const v = (
  id: string,
  size: string,
  colour: string,
  stock: number,
  priceOverride: number | null = null,
): SelectableVariant => ({
  id,
  sku: id,
  stock,
  priceOverride,
  size: { id: size, label: size, sortOrder: ["S", "M", "L"].indexOf(size) },
  colour: { id: colour, name: colour, hex: "#000000" },
});

describe("variant selection", () => {
  const variants = [v("1", "S", "Green", 0), v("2", "M", "Green", 3), v("3", "S", "Pink", 5, 5000)];

  it("marks sizes sold out for the chosen colour", () => {
    expect(sizeAvailable(variants, "S", "Green")).toBe(false);
    expect(sizeAvailable(variants, "S", null)).toBe(true);
    expect(sizeAvailable(variants, "M", "Pink")).toBe(false);
  });

  it("marks colours sold out for the chosen size", () => {
    expect(colourAvailable(variants, "Green", "S")).toBe(false);
    expect(colourAvailable(variants, "Pink", "S")).toBe(true);
  });

  it("finds the chosen variant only when both are picked", () => {
    expect(findVariant(variants, { sizeId: "M", colourId: null })).toBeNull();
    expect(findVariant(variants, { sizeId: "M", colourId: "Green" })?.id).toBe("2");
  });

  it("pre-selects single options", () => {
    expect(initialSelection([v("1", "S", "Green", 1)])).toEqual({ sizeId: "S", colourId: "Green" });
    expect(initialSelection(variants)).toEqual({ sizeId: null, colourId: null });
  });

  it("uses variant price override before sale and base price", () => {
    expect(unitPrice({ basePrice: 4500, salePrice: 4000 }, variants[2])).toBe(5000);
    expect(unitPrice({ basePrice: 4500, salePrice: 4000 }, variants[1])).toBe(4000);
    expect(unitPrice({ basePrice: 4500, salePrice: null }, null)).toBe(4500);
  });

  it("caps quantity at stock and 10", () => {
    expect(maxQuantity(variants[1])).toBe(3);
    expect(maxQuantity({ stock: 50 })).toBe(10);
  });
});

describe("variant SKUs", () => {
  it("builds readable codes", () => {
    expect(attributeCode("Green")).toBe("GRN");
    expect(attributeCode("Unstitched")).toBe("UNS");
    expect(attributeCode("XL")).toBe("XL");
    expect(variantSku("YM-LWN-001", "M", "Green")).toBe("YM-LWN-001-M-GRN");
  });
});

describe("order status transitions", () => {
  it("allows confirming and cancelling WhatsApp orders only", () => {
    expect(canTransition("AWAITING_WHATSAPP_CONFIRMATION", "PROCESSING")).toBe(true);
    expect(canTransition("AWAITING_WHATSAPP_CONFIRMATION", "SHIPPED")).toBe(false);
    expect(canTransition("CANCELLED", "PROCESSING")).toBe(false);
  });
});

import { whatsappCustomerSchema } from "@/features/whatsapp/schema";

describe("WhatsApp basket form rules (Admin → Settings → UK customers only)", () => {
  const base = { name: "Aisha", phone: "+92 300 1234567", note: "" };
  it("requires a UK postcode when UK-only is on", () => {
    expect(whatsappCustomerSchema(true).safeParse({ ...base, postcode: "4739186" }).success).toBe(
      false,
    );
    expect(
      whatsappCustomerSchema(true).safeParse({ ...base, postcode: "sw1a1aa" }).data?.postcode,
    ).toBe("SW1A 1AA");
  });
  it("accepts any postcode or town when UK-only is off", () => {
    expect(
      whatsappCustomerSchema(false).safeParse({ ...base, postcode: "Lahore 54000" }).data?.postcode,
    ).toBe("Lahore 54000");
    expect(whatsappCustomerSchema(false).safeParse({ ...base, postcode: "" }).success).toBe(false);
  });
});
