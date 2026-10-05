/**
 * Seed data for development and first deployment.
 *
 * EVERYTHING HERE IS SAMPLE DATA. Product names, prices, stock, size-chart
 * measurements, delivery fees and the WhatsApp number are placeholders that
 * the owner must replace from the admin panel. The script is idempotent and
 * safe to run repeatedly: it upserts by unique keys and never deletes.
 */
import { PrismaClient, ProductType, BannerPlacement, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SYSTEM_PAGES } from "../src/features/content/defaults";

const db = new PrismaClient();

const SIZES = [
  { label: "XS", code: "XS", sortOrder: 1 },
  { label: "S", code: "S", sortOrder: 2 },
  { label: "M", code: "M", sortOrder: 3 },
  { label: "L", code: "L", sortOrder: 4 },
  { label: "XL", code: "XL", sortOrder: 5 },
  { label: "XXL", code: "XXL", sortOrder: 6 },
  { label: "Unstitched", code: "UNS", sortOrder: 7 },
] as const;

const COLOURS = [
  { name: "Green", hex: "#2F6B4F", code: "GRN" },
  { name: "Maroon", hex: "#7A1F2B", code: "MRN" },
  { name: "Navy", hex: "#1F2F55", code: "NVY" },
  { name: "Ivory", hex: "#F4EDDD", code: "IVR" },
  { name: "Black", hex: "#1A1A1A", code: "BLK" },
  { name: "Pink", hex: "#D98BA0", code: "PNK" },
] as const;

type ColourName = (typeof COLOURS)[number]["name"];
type SizeLabel = (typeof SIZES)[number]["label"];

const CATEGORIES = [
  { slug: "ready-to-wear", name: "Ready to Wear", sortOrder: 1 },
  { slug: "ready-to-wear-2-piece", name: "2 Piece", sortOrder: 1, parent: "ready-to-wear" },
  { slug: "ready-to-wear-3-piece", name: "3 Piece", sortOrder: 2, parent: "ready-to-wear" },
  { slug: "unstitched", name: "Unstitched", sortOrder: 2 },
  { slug: "formal-wedding", name: "Formal & Wedding", sortOrder: 3 },
  { slug: "men", name: "Men", sortOrder: 4 },
] as const;

type CategorySlug = (typeof CATEGORIES)[number]["slug"];

const STITCHED_SIZES: SizeLabel[] = ["XS", "S", "M", "L", "XL", "XXL"];
const MEN_SIZES: SizeLabel[] = ["S", "M", "L", "XL", "XXL"];

interface SampleProduct {
  name: string;
  slug: string;
  sku: string;
  category: CategorySlug;
  fabric: string;
  pieces: number;
  type: ProductType;
  basePrice: number; // pence
  salePrice?: number; // pence
  sizes: SizeLabel[];
  colours: ColourName[];
  tags: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  sizeChart?: "women" | "men";
}

const PRODUCTS: SampleProduct[] = [
  {
    name: "Sample Embroidered Lawn 3 Piece",
    slug: "sample-embroidered-lawn-3-piece",
    sku: "YM-SMP-001",
    category: "ready-to-wear-3-piece",
    fabric: "Lawn",
    pieces: 3,
    type: ProductType.STITCHED,
    basePrice: 4500,
    sizes: STITCHED_SIZES,
    colours: ["Green", "Pink", "Ivory"],
    tags: ["lawn", "embroidered", "summer"],
    isNew: true,
    isFeatured: true,
    sizeChart: "women",
  },
  {
    name: "Sample Printed Lawn 2 Piece",
    slug: "sample-printed-lawn-2-piece",
    sku: "YM-SMP-002",
    category: "ready-to-wear-2-piece",
    fabric: "Lawn",
    pieces: 2,
    type: ProductType.STITCHED,
    basePrice: 3500,
    salePrice: 2800,
    sizes: STITCHED_SIZES,
    colours: ["Navy", "Pink"],
    tags: ["lawn", "printed", "summer"],
    isBestSeller: true,
    sizeChart: "women",
  },
  {
    name: "Sample Cambric Kurta 1 Piece",
    slug: "sample-cambric-kurta-1-piece",
    sku: "YM-SMP-003",
    category: "ready-to-wear",
    fabric: "Cambric",
    pieces: 1,
    type: ProductType.STITCHED,
    basePrice: 2500,
    sizes: STITCHED_SIZES,
    colours: ["Black", "Maroon"],
    tags: ["cambric", "kurta"],
    isNew: true,
    sizeChart: "women",
  },
  {
    name: "Sample Khaddar 3 Piece",
    slug: "sample-khaddar-3-piece",
    sku: "YM-SMP-004",
    category: "ready-to-wear-3-piece",
    fabric: "Khaddar",
    pieces: 3,
    type: ProductType.STITCHED,
    basePrice: 5500,
    salePrice: 4400,
    sizes: STITCHED_SIZES,
    colours: ["Maroon", "Navy"],
    tags: ["khaddar", "winter"],
    isBestSeller: true,
    sizeChart: "women",
  },
  {
    name: "Sample Unstitched Lawn 3 Piece",
    slug: "sample-unstitched-lawn-3-piece",
    sku: "YM-SMP-005",
    category: "unstitched",
    fabric: "Lawn",
    pieces: 3,
    type: ProductType.UNSTITCHED,
    basePrice: 3900,
    sizes: ["Unstitched"],
    colours: ["Green", "Ivory", "Pink"],
    tags: ["lawn", "unstitched", "summer"],
    isNew: true,
    isBestSeller: true,
  },
  {
    name: "Sample Unstitched Chiffon 3 Piece",
    slug: "sample-unstitched-chiffon-3-piece",
    sku: "YM-SMP-006",
    category: "unstitched",
    fabric: "Chiffon",
    pieces: 3,
    type: ProductType.UNSTITCHED,
    basePrice: 6500,
    sizes: ["Unstitched"],
    colours: ["Black", "Maroon"],
    tags: ["chiffon", "unstitched", "festive"],
  },
  {
    name: "Sample Unstitched Cambric 2 Piece",
    slug: "sample-unstitched-cambric-2-piece",
    sku: "YM-SMP-007",
    category: "unstitched",
    fabric: "Cambric",
    pieces: 2,
    type: ProductType.UNSTITCHED,
    basePrice: 2900,
    salePrice: 2300,
    sizes: ["Unstitched"],
    colours: ["Navy", "Green"],
    tags: ["cambric", "unstitched"],
  },
  {
    name: "Sample Organza Formal 3 Piece",
    slug: "sample-organza-formal-3-piece",
    sku: "YM-SMP-008",
    category: "formal-wedding",
    fabric: "Organza",
    pieces: 3,
    type: ProductType.STITCHED,
    basePrice: 12000,
    sizes: STITCHED_SIZES,
    colours: ["Ivory", "Pink"],
    tags: ["organza", "formal", "wedding"],
    isFeatured: true,
    isNew: true,
    sizeChart: "women",
  },
  {
    name: "Sample Embroidered Chiffon Wedding Suit",
    slug: "sample-embroidered-chiffon-wedding-suit",
    sku: "YM-SMP-009",
    category: "formal-wedding",
    fabric: "Chiffon",
    pieces: 3,
    type: ProductType.STITCHED,
    basePrice: 18000,
    salePrice: 15000,
    sizes: STITCHED_SIZES,
    colours: ["Maroon", "Green"],
    tags: ["chiffon", "wedding", "embroidered"],
    isBestSeller: true,
    sizeChart: "women",
  },
  {
    name: "Sample Unstitched Formal Organza 3 Piece",
    slug: "sample-unstitched-formal-organza-3-piece",
    sku: "YM-SMP-010",
    category: "formal-wedding",
    fabric: "Organza",
    pieces: 3,
    type: ProductType.UNSTITCHED,
    basePrice: 9500,
    sizes: ["Unstitched"],
    colours: ["Ivory", "Black"],
    tags: ["organza", "formal", "unstitched"],
  },
  {
    name: "Sample Men's Cotton Kameez Shalwar",
    slug: "sample-mens-cotton-kameez-shalwar",
    sku: "YM-SMP-011",
    category: "men",
    fabric: "Cotton",
    pieces: 2,
    type: ProductType.STITCHED,
    basePrice: 4000,
    sizes: MEN_SIZES,
    colours: ["Ivory", "Black", "Navy"],
    tags: ["men", "cotton", "kameez shalwar"],
    isBestSeller: true,
    isNew: true,
    sizeChart: "men",
  },
  {
    name: "Sample Men's Wash & Wear Unstitched",
    slug: "sample-mens-wash-and-wear-unstitched",
    sku: "YM-SMP-012",
    category: "men",
    fabric: "Wash & Wear",
    pieces: 2,
    type: ProductType.UNSTITCHED,
    basePrice: 3200,
    sizes: ["Unstitched"],
    colours: ["Navy", "Black"],
    tags: ["men", "wash and wear", "unstitched"],
  },
];

// Sample measurements in inches. Replace with real measurements.
const WOMEN_CHART_ROWS = [
  { size: "XS", chest: 34, length: 40, sleeve: 20, trouserLength: 37 },
  { size: "S", chest: 36, length: 41, sleeve: 21, trouserLength: 38 },
  { size: "M", chest: 38, length: 42, sleeve: 21.5, trouserLength: 38.5 },
  { size: "L", chest: 41, length: 43, sleeve: 22, trouserLength: 39 },
  { size: "XL", chest: 44, length: 44, sleeve: 22.5, trouserLength: 39.5 },
  { size: "XXL", chest: 47, length: 45, sleeve: 23, trouserLength: 40 },
];
const MEN_CHART_ROWS = [
  { size: "S", chest: 40, length: 40, sleeve: 23, trouserLength: 40 },
  { size: "M", chest: 42, length: 41, sleeve: 23.5, trouserLength: 41 },
  { size: "L", chest: 44, length: 42, sleeve: 24, trouserLength: 42 },
  { size: "XL", chest: 46, length: 43, sleeve: 24.5, trouserLength: 42.5 },
  { size: "XXL", chest: 48, length: 44, sleeve: 25, trouserLength: 43 },
];

// Deterministic sample stock so the shop shows a mix of in-stock, low-stock and sold-out variants.
function sampleStock(productIndex: number, variantIndex: number): number {
  const n = (productIndex * 7 + variantIndex * 3) % 11;
  if (n === 0) return 0;
  if (n <= 2) return n + 1; // 2-3 left
  return n + 4;
}

async function main() {
  // Sizes and colours
  const sizeIds = new Map<string, string>();
  for (const s of SIZES) {
    const row = await db.size.upsert({
      where: { label: s.label },
      update: { sortOrder: s.sortOrder },
      create: { label: s.label, sortOrder: s.sortOrder },
    });
    sizeIds.set(s.label, row.id);
  }
  const colourIds = new Map<string, string>();
  for (const c of COLOURS) {
    const row = await db.colour.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, hex: c.hex },
    });
    colourIds.set(c.name, row.id);
  }

  // Categories (parents are listed before children)
  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const parentId = "parent" in c ? categoryIds.get(c.parent) : undefined;
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, name: c.name, sortOrder: c.sortOrder, parentId },
    });
    categoryIds.set(c.slug, row.id);
  }

  // Size charts
  const womenChart = await db.sizeChart.upsert({
    where: { name: "Sample Women's Size Chart" },
    update: {},
    create: {
      name: "Sample Women's Size Chart",
      rows: WOMEN_CHART_ROWS,
      notes: "SAMPLE MEASUREMENTS. Replace with real measurements.",
    },
  });
  const menChart = await db.sizeChart.upsert({
    where: { name: "Sample Men's Size Chart" },
    update: {},
    create: {
      name: "Sample Men's Size Chart",
      rows: MEN_CHART_ROWS,
      notes: "SAMPLE MEASUREMENTS. Replace with real measurements.",
    },
  });

  // Products and variants
  for (const [pIndex, p] of PRODUCTS.entries()) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Unknown category ${p.category}`);
    const sizeChartId =
      p.sizeChart === "women" ? womenChart.id : p.sizeChart === "men" ? menChart.id : null;

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description:
          "This is a sample product created by the seed script. Replace the name, description, photos, price and stock from the admin panel.",
        careDetails: "Sample care details: gentle hand wash in cold water. Do not bleach.",
        fabric: p.fabric,
        pieces: p.pieces,
        type: p.type,
        basePrice: p.basePrice,
        salePrice: p.salePrice ?? null,
        categoryId,
        sizeChartId,
        tags: p.tags,
        isNew: p.isNew ?? false,
        isBestSeller: p.isBestSeller ?? false,
        isFeatured: p.isFeatured ?? false,
      },
    });

    let vIndex = 0;
    for (const sizeLabel of p.sizes) {
      for (const colourName of p.colours) {
        const sizeCode = SIZES.find((s) => s.label === sizeLabel)!.code;
        const colourCode = COLOURS.find((c) => c.name === colourName)!.code;
        const sku = `${p.sku}-${sizeCode}-${colourCode}`;
        await db.variant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            sizeId: sizeIds.get(sizeLabel)!,
            colourId: colourIds.get(colourName)!,
            sku,
            stock: sampleStock(pIndex, vIndex),
          },
        });
        vIndex++;
      }
    }
  }

  // Settings (single row). PLACEHOLDER values: replace in Admin > Settings.
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      whatsappNumber: "447000000000",
      freeDeliveryThreshold: 7500,
      standardDeliveryFee: 399,
      expressDeliveryFee: 699,
      announcementText: "Sample announcement: edit this in Admin > Settings",
      businessAddress: "[UK ADDRESS]",
      returnsDays: 14,
    },
  });

  // Banners
  const bannerCount = await db.banner.count();
  if (bannerCount === 0) {
    await db.banner.createMany({
      data: [
        {
          title: "Sample hero banner",
          subtitle: "Replace this banner and image in Admin > Banners",
          ctaText: "Shop New In",
          ctaUrl: "/collections/new-in",
          placement: BannerPlacement.HERO,
          sortOrder: 1,
        },
        {
          title: "Sample announcement banner",
          placement: BannerPlacement.ANNOUNCEMENT,
          sortOrder: 1,
        },
      ],
    });
  }

  // Information pages (create only; never overwrite the owner's edits)
  for (const page of SYSTEM_PAGES) {
    await db.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        slug: page.slug,
        title: page.title,
        body: page.body,
        metaDescription: page.metaDescription,
        sortOrder: page.sortOrder,
      },
    });
  }

  // First admin user (only when credentials are provided)
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 10) {
      throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters");
    }
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.user.upsert({
      where: { email: adminEmail },
      update: { role: Role.ADMIN },
      create: { email: adminEmail, name: "Admin", passwordHash, role: Role.ADMIN },
    });
    console.log(`Admin user ready: ${adminEmail}`);
  } else {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: skipped admin user.");
  }

  const [products, variants] = await Promise.all([db.product.count(), db.variant.count()]);
  console.log(`Seed complete: ${products} products, ${variants} variants.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
