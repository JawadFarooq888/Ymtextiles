import { describe, expect, it } from "vitest";
import {
  MAX_WHATSAPP_URL_LENGTH,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  type WhatsAppOrder,
  type WhatsAppOrderItem,
} from "@/features/whatsapp/message";

const settings = {
  whatsappGreeting: "Hi YM Textiles, I would like to order:",
  whatsappNumber: "447123456789",
};
const SITE = "https://ymtextiles.co.uk";

const item = (overrides: Partial<WhatsAppOrderItem> = {}): WhatsAppOrderItem => ({
  productName: "Embroidered Lawn 3 Piece",
  productSlug: "embroidered-lawn-3-piece",
  sku: "YM-LWN-001-M-GRN",
  size: "M",
  colour: "Green",
  quantity: 2,
  unitPrice: 4500,
  lineTotal: 9000,
  ...overrides,
});

const order = (overrides: Partial<WhatsAppOrder> = {}): WhatsAppOrder => ({
  orderNumber: "YM-10234",
  publicToken: "abc123token",
  subtotal: 9000,
  deliveryFee: 0,
  total: 9000,
  items: [item()],
  ...overrides,
});

describe("buildWhatsAppMessage", () => {
  it("formats a single product order exactly as specified", () => {
    expect(buildWhatsAppMessage(order(), settings, SITE)).toBe(
      [
        "Hi YM Textiles, I would like to order:",
        "",
        "Order ref: YM-10234",
        "Product: Embroidered Lawn 3 Piece",
        "SKU: YM-LWN-001-M-GRN",
        "Size: M",
        "Colour: Green",
        "Quantity: 2",
        "Price: £45.00 each",
        "Total: £90.00",
        "",
        "Link: https://ymtextiles.co.uk/products/embroidered-lawn-3-piece",
        "",
        "Please confirm availability and delivery.",
      ].join("\n"),
    );
  });

  it("uses the greeting from settings and trims a trailing slash from the site URL", () => {
    const msg = buildWhatsAppMessage(
      order(),
      { ...settings, whatsappGreeting: "Salam!" },
      `${SITE}/`,
    );
    expect(msg.startsWith("Salam!\n")).toBe(true);
    expect(msg).toContain("Link: https://ymtextiles.co.uk/products/");
    expect(msg).not.toContain(".uk//products");
  });

  it("lists every basket line with totals, delivery and customer details", () => {
    const msg = buildWhatsAppMessage(
      order({
        customerName: "Aisha Khan",
        postcode: "B1 1AA",
        notes: "Please gift wrap",
        items: [
          item(),
          item({
            productName: "Chiffon Suit",
            sku: "YM-CHF-002-L-MRN",
            size: "L",
            colour: "Maroon",
            quantity: 1,
            unitPrice: 6500,
            lineTotal: 6500,
          }),
        ],
        subtotal: 15500,
        deliveryFee: 399,
        total: 15899,
      }),
      settings,
      SITE,
    );
    expect(msg).toContain("Name: Aisha Khan");
    expect(msg).toContain("Postcode: B1 1AA");
    expect(msg).toContain("1. Embroidered Lawn 3 Piece (SKU YM-LWN-001-M-GRN)");
    expect(msg).toContain("Size: M, Colour: Green, Qty: 2 = £90.00");
    expect(msg).toContain("2. Chiffon Suit (SKU YM-CHF-002-L-MRN)");
    expect(msg).toContain("Subtotal: £155.00");
    expect(msg).toContain("Delivery: £3.99");
    expect(msg).toContain("Total: £158.99");
    expect(msg).toContain("Note: Please gift wrap");
  });

  it("shows free delivery as Free", () => {
    const msg = buildWhatsAppMessage(
      order({ customerName: "A", items: [item(), item()] }),
      settings,
      SITE,
    );
    expect(msg).toContain("Delivery: Free");
  });

  it("falls back to a short message with a private link for very long baskets", () => {
    const items = Array.from({ length: 40 }, (_, i) =>
      item({
        productName: `Very Long Product Name Number ${i} With Embroidery`,
        sku: `YM-LONG-${i}`,
      }),
    );
    const msg = buildWhatsAppMessage(
      order({ customerName: "Aisha", postcode: "B1 1AA", items, subtotal: 360000, total: 360000 }),
      settings,
      SITE,
    );
    expect(msg).toContain("Order ref: YM-10234");
    expect(msg).toContain("Items: 80");
    expect(msg).toContain("Total: £3,600.00");
    expect(msg).toContain(`${SITE}/order/abc123token`);
    expect(msg).not.toContain("YM-LONG-1");
    expect(buildWhatsAppUrl(settings.whatsappNumber, msg).length).toBeLessThanOrEqual(
      MAX_WHATSAPP_URL_LENGTH,
    );
  });
});

describe("buildWhatsAppUrl", () => {
  it("encodes line breaks, £ and & so the message arrives intact", () => {
    const url = buildWhatsAppUrl("447123456789", "Price: £45.00\nA & B");
    expect(url).toBe("https://wa.me/447123456789?text=Price%3A%20%C2%A345.00%0AA%20%26%20B");
    expect(decodeURIComponent(url.split("?text=")[1])).toBe("Price: £45.00\nA & B");
  });

  it("strips non-digits from the number and omits text when no message", () => {
    expect(buildWhatsAppUrl("+44 7123 456789")).toBe("https://wa.me/447123456789");
  });
});
