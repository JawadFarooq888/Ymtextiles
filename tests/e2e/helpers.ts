import { expect, type Page } from "@playwright/test";

export function adminCredentials() {
  const email = process.env.E2E_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD (or SEED_ADMIN_*) to run admin tests");
  }
  return { email, password };
}

export async function loginAsAdmin(page: Page) {
  const { email, password } = adminCredentials();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

/**
 * Remove data created by tests even when a test fails half-way.
 * Test products use SKUs starting with "E2E-"; test orders are passed in by number.
 */
export async function cleanupTestData(orderNumbers: string[] = []) {
  const { PrismaClient } = await import("@prisma/client");
  const { v2: cloudinary } = await import("cloudinary");
  const db = new PrismaClient();
  try {
    const products = await db.product.findMany({
      where: { sku: { startsWith: "E2E-" } },
      include: { images: { select: { publicId: true } } },
    });
    if (process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      for (const img of products.flatMap((p) => p.images)) {
        if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => undefined);
      }
    }
    await db.product.deleteMany({ where: { id: { in: products.map((p) => p.id) } } });
    if (orderNumbers.length) {
      await db.order.deleteMany({ where: { orderNumber: { in: orderNumbers } } });
    }
  } finally {
    await db.$disconnect();
  }
}
