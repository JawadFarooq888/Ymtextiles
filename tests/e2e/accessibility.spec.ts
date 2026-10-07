import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { chooseJeans } from "./helpers";

/**
 * Accessibility checks from the point of view of a screen-reader / keyboard-only user,
 * on a phone-sized screen. axe covers WCAG 2.1 AA rules; the keyboard tests cover
 * things axe cannot see (focus order, focus moving into dialogs and back, announcements).
 */

const PAGES = [
  "/",
  "/collections/women",
  "/products/sample-mens-slim-jeans",
  "/search?q=slim",
  "/pages/size-guide",
  "/pages/delivery-returns",
  "/basket",
  "/admin/login",
  "/collections/does-not-exist",
];

const focusedIsInside = (page: Page, selector: string) =>
  page.evaluate((sel) => !!document.activeElement?.closest(sel), selector);

test.describe("mobile, screen reader", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  for (const path of PAGES) {
    test(`no serious WCAG issues on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        serious.map(
          (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
        ),
      ).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, "no sideways scrolling").toBeLessThanOrEqual(0);
    });
  }

  test("every page has one h1, a main landmark and a page title", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator("h1"), path).toHaveCount(1);
      await expect(page.getByRole("main"), path).toHaveCount(1);
      expect(await page.title(), path).not.toBe("");
    }
  });

  test("product cards read as one clear link", async ({ page }) => {
    await page.goto("/collections/sale");
    const link = page.getByRole("article").first().getByRole("link");
    const name = (await link.getAttribute("aria-label")) ?? (await link.innerText());
    // The product name should be announced once, not twice (image alt + heading).
    const accessible = await link.evaluate((el) => el.textContent ?? "");
    const productName = await page.getByRole("article").first().getByRole("heading").innerText();
    expect(accessible.split(productName).length - 1, name).toBe(1);
    // Name first, then price, then offers.
    await expect(link).toHaveAccessibleName(
      new RegExp(String.raw`^${productName} Sale price £[\d.]+ Was £[\d.]+ \d+% off$`),
    );
  });

  test("mobile menu opens with the keyboard, traps focus and returns it on Escape", async ({
    page,
  }) => {
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Open menu" });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await focusedIsInside(page, "[role=dialog]")).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test("wash, waist and length groups are named for screen readers", async ({ page }) => {
    await page.goto("/products/sample-mens-slim-jeans");
    await expect(page.getByRole("group", { name: /^Wash:/ })).toBeVisible();
    await expect(page.getByRole("group", { name: /^Waist:/ })).toBeVisible();
    await expect(page.getByRole("group", { name: /^Length:/ })).toBeVisible();
    await expect(page.getByRole("group", { name: "Quantity" })).toBeVisible();
  });
});

test.describe("desktop, keyboard only", () => {
  test("skip link is the first stop and jumps to the content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box && box.width > 40 && box.height > 20, "skip link is visible when focused").toBe(
      true,
    );
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("buy a product using only the keyboard", async ({ page }) => {
    await page.goto("/products/sample-mens-slim-jeans");

    // Choose wash, waist and length with the Space key.
    const press = async (group: RegExp, selector: string) => {
      const option = page.getByRole("group", { name: group }).locator(selector).first();
      await option.focus();
      await page.keyboard.press("Space");
      await expect(option).toHaveAttribute("aria-pressed", "true");
    };
    await press(/^Wash:/, 'button:not([aria-label*="sold out"])');
    await press(/^Waist:/, "button[aria-pressed]:not([disabled])");
    await press(/^Length:/, "button[aria-pressed]:not([disabled])");
    // Stock status is in a live region so it is announced.
    await expect(
      page.locator('[aria-live="polite"]').filter({ hasText: /In stock|Only \d+ left/ }),
    ).toBeVisible();

    const add = page.getByRole("button", { name: "Add to basket" });
    await add.focus();
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    expect(await focusedIsInside(page, "[role=dialog]")).toBe(true);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(add).toBeFocused();
    await expect(page.getByRole("button", { name: /Basket, 1 item/ })).toBeVisible();
  });

  test("clicking Order on WhatsApp too early explains why, in an alert", async ({ page }) => {
    await page.goto("/products/sample-mens-slim-jeans");
    const button = page.getByRole("button", { name: "Order on WhatsApp" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("alert").filter({ hasText: "Please select a size and colour" }),
    ).toBeVisible();
    await expect(button).toHaveAttribute("aria-describedby", "purchase-prompt");
  });

  test("basket WhatsApp form moves focus to the first error and links errors to fields", async ({
    page,
  }) => {
    await page.goto("/products/sample-mens-slim-jeans");
    await chooseJeans(page);
    await page.getByRole("button", { name: "Add to basket" }).click();
    await page.keyboard.press("Escape");
    await page.goto("/basket");

    const open = page.getByRole("button", { name: "Order whole basket on WhatsApp" });
    await expect(open).toBeEnabled();
    await open.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Continue to WhatsApp" }).focus();
    await page.keyboard.press("Enter");

    const name = dialog.getByLabel("Your name");
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription(/Please enter your name/);
    await expect(dialog.getByLabel("Postcode")).toHaveAccessibleDescription(/valid UK postcode/);
  });

  test("mega menu opens from its button and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Show Men sub-categories" });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "Shop all Men" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("cookie consent", () => {
  // Start with no choice made, unlike the other tests.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("banner asks once, reject is as easy as accept, and it can be reopened", async ({
    page,
  }) => {
    await page.goto("/");
    const banner = page.getByRole("region", { name: "Cookie choices" });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("button", { name: "Reject analytics" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Accept analytics" })).toBeVisible();

    await banner.getByRole("button", { name: "Reject analytics" }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole("region", { name: "Cookie choices" })).toBeHidden();

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(page.getByRole("region", { name: "Cookie choices" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Cookie choices" })).toBeFocused();
  });
});
