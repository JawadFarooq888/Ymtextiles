import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { cleanupTestData, loginAsAdmin } from "./helpers";

// Orders created here are deleted afterwards, even if a test fails.
const createdOrders: string[] = [];
test.afterAll(() => cleanupTestData(createdOrders));

// Never hit the real WhatsApp: answer wa.me requests locally and inspect the URL instead.
async function stubWhatsApp(context: BrowserContext) {
  await context.route(/https:\/\/(wa\.me|api\.whatsapp\.com)\/.*/, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<title>WhatsApp stub</title>" }),
  );
}

function decodeMessage(url: string): string {
  return decodeURIComponent(new URL(url).searchParams.get("text") ?? "");
}

async function chooseAvailableColour(page: Page) {
  const colour = page
    .locator("fieldset")
    .filter({ hasText: "Colour:" })
    .locator('button[aria-pressed]:not([aria-label*="sold out"])')
    .first();
  const name = (await colour.getAttribute("aria-label")) ?? "";
  await colour.click();
  return name;
}

async function chooseAvailableSize(page: Page) {
  const size = page
    .locator("fieldset")
    .filter({ hasText: "Size:" })
    .locator("button[aria-pressed]:not([disabled])")
    .first();
  if ((await size.getAttribute("aria-pressed")) !== "true") await size.click();
  return (await size.innerText()).split("\n")[0].trim();
}

async function cancelOrderInAdmin(page: Page, orderNumber: string) {
  await page.goto(`/admin/orders?q=${orderNumber}`);
  await page.getByRole("link", { name: orderNumber }).click();
  await page.getByRole("button", { name: "Cancel order" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
}

test("product page: WhatsApp order needs a selection, creates an order and opens WhatsApp with it", async ({
  page,
  context,
}) => {
  await stubWhatsApp(context);
  await page.goto("/products/sample-embroidered-lawn-3-piece");

  // Clicking before choosing explains what is missing and opens nothing.
  // (The button is aria-disabled, which Playwright treats as not clickable; real users can still click it.)
  await page.getByRole("button", { name: "Order on WhatsApp" }).click({ force: true });
  await expect(
    page.getByRole("alert").filter({ hasText: "Please select a size and colour" }),
  ).toBeVisible();

  const colour = await chooseAvailableColour(page);
  const size = await chooseAvailableSize(page);
  await page.getByRole("button", { name: "Increase quantity" }).click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Order on WhatsApp" }).click();
  const popup = await popupPromise;
  await popup.waitForURL(/wa\.me/);

  const url = popup.url();
  expect(url).toMatch(/^https:\/\/wa\.me\/\d{10,15}\?text=/);
  const message = decodeMessage(url);
  expect(message).toMatch(/^Hi YM Textiles, I would like to order:\n\nOrder ref: YM-\d+\n/);
  expect(message).toContain("Product: Sample Embroidered Lawn 3 Piece");
  expect(message).toContain(`Size: ${size}`);
  expect(message).toContain(`Colour: ${colour}`);
  expect(message).toContain("Quantity: 2");
  expect(message).toContain("Price: £45.00 each");
  expect(message).toContain("Total: £90.00");
  expect(message).toContain("/products/sample-embroidered-lawn-3-piece");
  expect(message.endsWith("Please confirm availability and delivery.")).toBe(true);

  const orderNumber = message.match(/Order ref: (YM-\d+)/)![1];
  createdOrders.push(orderNumber);
  await expect(page.getByText(`Order ${orderNumber} created`)).toBeVisible();

  // The order exists in admin, awaiting confirmation. Confirm it (stock goes down), then cancel (stock comes back).
  await loginAsAdmin(page);
  await page.goto(`/admin/orders?channel=WHATSAPP&q=${orderNumber}`);
  await page.getByRole("link", { name: orderNumber }).click();
  await expect(page.getByText("Awaiting WhatsApp confirmation").first()).toBeVisible();
  const stockText = page.getByText(/\d+ in stock now/);
  const before = Number((await stockText.innerText()).match(/(\d+) in stock now/)![1]);

  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("Processing", { exact: true })).toBeVisible();
  await expect(page.getByText(`${before - 2} in stock now`)).toBeVisible();

  await page.getByRole("button", { name: "Cancel order" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByText(`${before} in stock now`)).toBeVisible();
});

test("basket: add two items, validate details, order the whole basket on WhatsApp", async ({
  page,
  context,
}) => {
  await stubWhatsApp(context);

  // Item 1: unstitched (size pre-selected)
  await page.goto("/products/sample-unstitched-lawn-3-piece");
  await chooseAvailableColour(page);
  await page.getByRole("button", { name: "Add to basket" }).click();
  await expect(page.getByRole("dialog").getByText("Your basket")).toBeVisible();
  await page.keyboard.press("Escape");

  // Item 2: stitched
  await page.goto("/products/sample-khaddar-3-piece");
  await chooseAvailableColour(page);
  await chooseAvailableSize(page);
  await page.getByRole("button", { name: "Add to basket" }).click();
  await expect(page.getByRole("dialog").getByText("2 items")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Basket, 2 items/ })).toBeVisible();

  await page.goto("/basket");
  await expect(page.getByRole("heading", { name: "Your basket", level: 1 })).toBeVisible();
  await expect(page.getByText("Sample Unstitched Lawn 3 Piece")).toBeVisible();
  await expect(page.getByText("Sample Khaddar 3 Piece")).toBeVisible();
  // £39.00 + £44.00 sale = £83.00, over the £75 free delivery threshold
  await expect(page.getByLabel("Order summary").getByText("£83.00").last()).toBeVisible();
  await expect(page.getByLabel("Order summary").getByText("Free")).toBeVisible();

  await page.getByRole("button", { name: "Order whole basket on WhatsApp" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Your name").fill("Test Customer");
  await dialog.getByLabel("Mobile number").fill("07123 456789");
  await dialog.getByLabel("Postcode").fill("not a postcode");
  await dialog.getByRole("button", { name: "Continue to WhatsApp" }).click();
  await expect(dialog.getByText("Enter a valid UK postcode")).toBeVisible();

  await dialog.getByLabel("Postcode").fill("sw1a1aa");
  await dialog.getByLabel("Note (optional)").fill("Automated test order");
  const popupPromise = page.waitForEvent("popup");
  await dialog.getByRole("button", { name: "Continue to WhatsApp" }).click();
  const popup = await popupPromise;
  await popup.waitForURL(/wa\.me/);

  const message = decodeMessage(popup.url());
  expect(message).toContain("Name: Test Customer");
  expect(message).toContain("Postcode: SW1A 1AA");
  expect(message).toContain("1. Sample ");
  expect(message).toContain("2. Sample ");
  expect(message).toContain("Subtotal: £83.00");
  expect(message).toContain("Delivery: Free");
  expect(message).toContain("Total: £83.00");
  expect(message).toContain("Note: Automated test order");

  // Basket is emptied after ordering
  await expect(page.getByText("Your basket is empty")).toBeVisible();

  const orderNumber = message.match(/Order ref: (YM-\d+)/)![1];
  createdOrders.push(orderNumber);
  await loginAsAdmin(page);
  await cancelOrderInAdmin(page, orderNumber);
});

test("floating WhatsApp button pre-fills the product on product pages", async ({ page }) => {
  await page.goto("/products/sample-khaddar-3-piece");
  const link = page.getByRole("link", { name: "Chat with us on WhatsApp" });
  await expect(link).toHaveAttribute("href", /Sample%20Khaddar%203%20Piece/);
  await page.goto("/");
  await expect(link).toHaveAttribute("href", /I%20have%20a%20question\.$/);
});

test("cron endpoint rejects requests without the secret", async ({ request }) => {
  const res = await request.get("/api/cron/expire-whatsapp-orders");
  expect(res.status()).toBe(401);
  const ok = await request.get("/api/cron/expire-whatsapp-orders", {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toHaveProperty("cancelled");
});
