import { expect, test } from "@playwright/test";
import { chooseJeans } from "./helpers";

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
        await page.getByRole("dialog").getByText("Women", { exact: true }).click();
        await page.getByRole("dialog").getByRole("link", { name: "Shop all Women" }).click();
      } else {
        await page
          .getByRole("navigation", { name: "Main" })
          .getByRole("link", { name: "Women", exact: true })
          .click();
      }
      await expect(page).toHaveURL(/\/collections\/women/);
      await expect(page.getByRole("heading", { name: "Women", level: 1 })).toBeVisible();

      // Filter by fit; the URL keeps the filter so it can be shared
      if (viewport.name === "mobile") await page.getByRole("button", { name: /^Filters/ }).click();
      await page.getByRole("button", { name: "Wide leg", exact: true }).click();
      await expect(page).toHaveURL(/fit=Wide/);
      if (viewport.name === "mobile") await page.keyboard.press("Escape");
      const cards = page.getByRole("article");
      await expect(cards).toHaveCount(1);
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/${viewport.name}-collection.png`, fullPage: true });

      await cards.first().getByRole("link").click();
      await expect(page).toHaveURL(/\/products\/sample-womens-wide-leg-jeans/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Wide Leg");
      // Jeans are chosen by waist and length separately
      await expect(page.getByRole("group", { name: /^Waist:/ })).toBeVisible();
      await expect(page.getByRole("group", { name: /^Length:/ })).toBeVisible();
      if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/${viewport.name}-product.png`, fullPage: true });
    });
  });
}

test("product page: choosing wash, waist and length shows stock; size chart in inches and cm", async ({
  page,
}) => {
  await page.goto("/products/sample-mens-slim-jeans");
  const chosen = await chooseJeans(page);
  await expect(page.getByText(`Wash: ${chosen.wash}`)).toBeVisible();
  await expect(page.getByText(`Waist: ${chosen.waist}`)).toBeVisible();
  await expect(page.getByText(`Length: ${chosen.length}`)).toBeVisible();
  await expect(page.getByText(/In stock|Only \d+ left/)).toBeVisible();
  await page.getByRole("button", { name: "Size chart" }).click();
  await expect(page.getByRole("dialog")).toContainText("Waist");
  await expect(page.getByRole("dialog")).toContainText("Leg opening");
  await page.getByRole("radio", { name: "Centimetres" }).click();
  await expect(page.getByRole("dialog").getByRole("cell").first()).not.toBeEmpty();
});

test("search finds products by partial word", async ({ page }) => {
  await page.goto("/search?q=skinn");
  await expect(page.getByText(/results? for/)).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("static pages and 404", async ({ page }) => {
  await page.goto("/pages/delivery-returns");
  await expect(page.getByRole("heading", { name: "Delivery & Returns", level: 1 })).toBeVisible();
  const res = await page.goto("/collections/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("We couldn't find that page")).toBeVisible();
});
