import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

// 8x8 green PNG, small enough to upload quickly.
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGNQkwlFQwwjVhAAvOEhwaJ8gW4AAAAASUVORK5CYII=",
  "base64",
);

test("all admin pages load", async ({ page }) => {
  await loginAsAdmin(page);
  for (const [path, heading] of [
    ["/admin/products", "Products"],
    ["/admin/products/new", "New product"],
    ["/admin/products/import", "Import products from CSV"],
    ["/admin/categories", "Categories"],
    ["/admin/attributes", "Sizes & colours"],
    ["/admin/size-charts", "Size charts"],
    ["/admin/size-charts/new", "New size chart"],
    ["/admin/banners", "Banners"],
    ["/admin/settings", "Settings"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  const csv = await page.request.get("/admin/products/export");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("product_sku,name,slug");
});

test("admin is redirected to login when signed out", async ({ page }) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admin creates a product and it appears in the shop", async ({ page }) => {
  const stamp = Date.now();
  const name = `E2E Test Suit ${stamp}`;
  const slug = `e2e-test-suit-${stamp}`;
  const sku = `E2E-${stamp}`;

  await loginAsAdmin(page);

  // Create the product
  await page.goto("/admin/products/new");
  await page.getByLabel("Product name").fill(name);
  await expect(page.getByLabel("URL slug")).toHaveValue(slug);
  await page.getByLabel("Product SKU").fill(sku);
  await page.getByLabel("Category").selectOption({ label: "Unstitched" });
  await page.getByLabel("Fabric", { exact: true }).fill("Lawn");
  await page.getByLabel("Regular price (£)").fill("49.99");
  await page.getByLabel("Description", { exact: true }).fill("Created by an automated test.");

  // Photo upload goes straight to Cloudinary
  await page.locator("#product-images-input").setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: TEST_PNG,
  });
  await expect(page.getByLabel("Image 1 alt text")).toHaveValue(name);

  // Variant matrix: M and L in Green
  await page.getByRole("checkbox", { name: "M", exact: true }).click();
  await page.getByRole("checkbox", { name: "L", exact: true }).click();
  await page.getByRole("checkbox", { name: "Green", exact: true }).click();
  await page.getByRole("button", { name: "Generate variants" }).click();
  await expect(page.getByLabel("SKU for M Green")).toHaveValue(`${sku}-M-GRN`);
  await expect(page.getByLabel("SKU for L Green")).toHaveValue(`${sku}-L-GRN`);
  await page.getByLabel("Set stock for all rows").fill("5");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByLabel("Stock for M Green")).toHaveValue("5");

  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  const adminUrl = page.url();

  // It shows in the shop straight away
  await page.goto(`/products/${slug}`);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("£49.99")).toBeVisible();
  await expect(page.getByRole("button", { name: "M", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "L", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: name })).toBeVisible();

  // Clean up
  await page.goto(adminUrl);
  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  const gone = await page.goto(`/products/${slug}`);
  expect(gone?.status()).toBe(404);
});
