import { expect, test } from "@playwright/test";

const SHOTS = process.env.E2E_SCREENSHOTS; // set to a folder to save screenshots for review

for (const viewport of [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1366, height: 900 },
]) {
  test.describe(`shop browsing (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("home → collection → filter → product", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("link", { name: "YM TEXTILES" }).first()).toBeVisible();
      await expect(page.getByRole("heading", { name: "New arrivals", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Why YM Textiles" })).toBeVisible();
      // No horizontal scrolling on small screens
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/${viewport.name}-home.png`, fullPage: true });

      // Navigate to a category via the menu
      if (viewport.name === "mobile") {
        await page.getByRole("button", { name: "Open menu" }).click();
        await page.getByRole("dialog").getByText("Unstitched", { exact: true }).click();
      } else {
        await page
          .getByRole("navigation", { name: "Main" })
          .getByRole("link", { name: "Unstitched" })
          .click();
      }
      await expect(page).toHaveURL(/\/collections\/unstitched/);
      await expect(page.getByRole("heading", { name: "Unstitched", level: 1 })).toBeVisible();

      // Filter by fabric; the URL keeps the filter so it can be shared
      if (viewport.name === "mobile") await page.getByRole("button", { name: /^Filters/ }).click();
      await page.getByRole("button", { name: "Chiffon", exact: true }).click();
      await expect(page).toHaveURL(/fabric=Chiffon/);
      if (viewport.name === "mobile") await page.keyboard.press("Escape");
      const cards = page.getByRole("article");
      await expect(cards).toHaveCount(1);
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/${viewport.name}-collection.png`, fullPage: true });

      await cards.first().getByRole("link").click();
      await expect(page).toHaveURL(/\/products\/sample-unstitched-chiffon-3-piece/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Chiffon");
      // Single size is pre-selected for unstitched products
      await expect(page.getByRole("button", { name: /Unstitched/, pressed: true })).toBeVisible();
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/${viewport.name}-product.png`, fullPage: true });
    });
  });
}

test("product page: selecting colour and size shows stock and blocks sold-out sizes", async ({
  page,
}) => {
  await page.goto("/products/sample-embroidered-lawn-3-piece");
  await page.getByRole("button", { name: /^Green/ }).click();
  await expect(page.getByText("Colour: Green")).toBeVisible();
  // Pick the first size that is available in Green
  const available = page
    .locator("fieldset")
    .filter({ hasText: "Size:" })
    .locator("button[aria-pressed]:not([disabled])")
    .first();
  await available.click();
  await expect(page.getByText(/In stock|Only \d+ left/)).toBeVisible();
  await page.getByRole("button", { name: "Size chart" }).click();
  await expect(page.getByRole("dialog")).toContainText("Chest");
  await page.getByRole("radio", { name: "Centimetres" }).click();
  await expect(page.getByRole("dialog").getByRole("cell").first()).not.toBeEmpty();
});

test("search finds products by partial word", async ({ page }) => {
  await page.goto("/search?q=embro");
  await expect(page.getByText(/result/)).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("static pages and 404", async ({ page }) => {
  await page.goto("/pages/delivery-returns");
  await expect(page.getByRole("heading", { name: "Delivery & Returns", level: 1 })).toBeVisible();
  const res = await page.goto("/collections/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("We couldn't find that page")).toBeVisible();
});
