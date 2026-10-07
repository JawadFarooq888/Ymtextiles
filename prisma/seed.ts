/**
 * Seed data for development and first deployment (jeans shop).
 *
 * EVERYTHING HERE IS SAMPLE DATA. Product names, prices, stock, size-chart
 * measurements, delivery fees and the WhatsApp number are placeholders that
 * the owner must replace from the admin panel. The script is idempotent and
 * safe to run repeatedly: it creates what is missing and never overwrites or
 * deletes the owner's data.
 */
import { BannerPlacement, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SYSTEM_PAGES } from "../src/features/content/defaults";
import { DEFAULT_JEANS_COLUMNS } from "../src/features/size-charts/chart";

const db = new PrismaClient();

// ---------- Sizes (inches) ----------
const MEN_WAISTS = [28, 30, 32, 34, 36, 38];
const MEN_LENGTHS = [30, 32, 34];
const WOMEN_WAISTS = [24, 26, 28, 30, 32];
const WOMEN_LENGTHS = [28, 30, 32];
const KIDS_SIZES = ["3-4Y", "5-6Y", "7-8Y", "9-10Y", "11-12Y", "13-14Y"];

const jeansLabel = (w: number, l: number) => `W${w} L${l}`;
const grid = (waists: number[], lengths: number[]) =>
  waists.flatMap((w) => lengths.map((l) => ({ waist: w, length: l, label: jeansLabel(w, l) })));

const WASHES = [
  { name: "Light Blue", hex: "#A7C4E0", code: "LBL" },
  { name: "Mid Blue", hex: "#5B84B1", code: "MBL" },
  { name: "Dark Indigo", hex: "#23395B", code: "IND" },
  { name: "Black", hex: "#1C1C1C", code: "BLK" },
  { name: "Grey", hex: "#8A8D91", code: "GRY" },
  { name: "Ecru", hex: "#EDE6D6", code: "ECR" },
] as const;
type Wash = (typeof WASHES)[number]["name"];

// ---------- Categories (parents before children) ----------
const CATEGORIES = [
  { slug: "men", name: "Men", sortOrder: 1 },
  { slug: "men-skinny", name: "Skinny", sortOrder: 1, parent: "men" },
  { slug: "men-slim", name: "Slim", sortOrder: 2, parent: "men" },
  { slug: "men-straight", name: "Straight", sortOrder: 3, parent: "men" },
  { slug: "men-relaxed", name: "Relaxed & Bootcut", sortOrder: 4, parent: "men" },
  { slug: "women", name: "Women", sortOrder: 2 },
  { slug: "women-skinny", name: "Skinny", sortOrder: 1, parent: "women" },
  { slug: "women-straight", name: "Straight", sortOrder: 2, parent: "women" },
  { slug: "women-wide-leg", name: "Wide Leg", sortOrder: 3, parent: "women" },
  { slug: "women-mom", name: "Mom & Boyfriend", sortOrder: 4, parent: "women" },
  { slug: "kids", name: "Kids", sortOrder: 3 },
  { slug: "kids-boys", name: "Boys", sortOrder: 1, parent: "kids" },
  { slug: "kids-girls", name: "Girls", sortOrder: 2, parent: "kids" },
  { slug: "unisex", name: "Unisex", sortOrder: 4 },
] as const;
type CategorySlug = (typeof CATEGORIES)[number]["slug"];

// ---------- Sample size charts (inches) ----------
const MEN_CHART = MEN_WAISTS.map((w) => ({
  size: `W${w}`,
  values: [w, w + 7, null, 10.5 + (w - 28) * 0.125, 7 + (w - 28) * 0.125],
}));
const WOMEN_CHART = WOMEN_WAISTS.map((w) => ({
  size: `W${w}`,
  values: [w, w + 10, null, 10 + (w - 24) * 0.125, 6 + (w - 24) * 0.125],
}));
const KIDS_COLUMNS = ["Waist", "Hip", "Inside leg", "Height"];
const KIDS_CHART = KIDS_SIZES.map((size, i) => ({
  size,
  values: [20 + i, 22 + i * 1.5, 15 + i * 2.5, 39 + i * 5],
}));

// ---------- Sample products ----------
interface SampleProduct {
  name: string;
  slug: string;
  sku: string;
  category: CategorySlug;
  fit: string;
  rise: "Low" | "Mid" | "High";
  stretch: "No stretch" | "Comfort stretch" | "Super stretch";
  fabric: string;
  basePrice: number; // pence
  salePrice?: number;
  sizing: "men" | "women" | "kids";
  washes: Wash[];
  tags: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

const COTTON_STRETCH = "98% cotton, 2% elastane";
const RIGID = "100% cotton";

const PRODUCTS: SampleProduct[] = [
  {
    name: "Sample Men's Slim Jeans",
    slug: "sample-mens-slim-jeans",
    sku: "YMJ-SMP-001",
    category: "men-slim",
    fit: "Slim",
    rise: "Mid",
    stretch: "Comfort stretch",
    fabric: COTTON_STRETCH,
    basePrice: 3999,
    sizing: "men",
    washes: ["Dark Indigo", "Black", "Mid Blue"],
    tags: ["men", "slim"],
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
  },
  {
    name: "Sample Men's Straight Jeans",
    slug: "sample-mens-straight-jeans",
    sku: "YMJ-SMP-002",
    category: "men-straight",
    fit: "Straight",
    rise: "Mid",
    stretch: "No stretch",
    fabric: RIGID,
    basePrice: 3499,
    salePrice: 2999,
    sizing: "men",
    washes: ["Mid Blue", "Light Blue", "Black"],
    tags: ["men", "straight", "classic"],
    isBestSeller: true,
  },
  {
    name: "Sample Men's Skinny Jeans",
    slug: "sample-mens-skinny-jeans",
    sku: "YMJ-SMP-003",
    category: "men-skinny",
    fit: "Skinny",
    rise: "Mid",
    stretch: "Super stretch",
    fabric: "92% cotton, 6% polyester, 2% elastane",
    basePrice: 3299,
    sizing: "men",
    washes: ["Black", "Dark Indigo"],
    tags: ["men", "skinny"],
    isNew: true,
  },
  {
    name: "Sample Men's Relaxed Jeans",
    slug: "sample-mens-relaxed-jeans",
    sku: "YMJ-SMP-004",
    category: "men-relaxed",
    fit: "Relaxed",
    rise: "Mid",
    stretch: "No stretch",
    fabric: RIGID,
    basePrice: 4499,
    sizing: "men",
    washes: ["Light Blue", "Dark Indigo"],
    tags: ["men", "relaxed"],
  },
  {
    name: "Sample Men's Bootcut Jeans",
    slug: "sample-mens-bootcut-jeans",
    sku: "YMJ-SMP-005",
    category: "men-relaxed",
    fit: "Bootcut",
    rise: "Mid",
    stretch: "Comfort stretch",
    fabric: COTTON_STRETCH,
    basePrice: 3799,
    salePrice: 3199,
    sizing: "men",
    washes: ["Dark Indigo", "Mid Blue"],
    tags: ["men", "bootcut"],
  },
  {
    name: "Sample Women's High Rise Skinny Jeans",
    slug: "sample-womens-high-rise-skinny-jeans",
    sku: "YMJ-SMP-006",
    category: "women-skinny",
    fit: "Skinny",
    rise: "High",
    stretch: "Super stretch",
    fabric: "90% cotton, 8% polyester, 2% elastane",
    basePrice: 3499,
    sizing: "women",
    washes: ["Black", "Mid Blue", "Light Blue"],
    tags: ["women", "skinny", "high rise"],
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
  },
  {
    name: "Sample Women's Straight Leg Jeans",
    slug: "sample-womens-straight-leg-jeans",
    sku: "YMJ-SMP-007",
    category: "women-straight",
    fit: "Straight",
    rise: "High",
    stretch: "Comfort stretch",
    fabric: COTTON_STRETCH,
    basePrice: 3999,
    salePrice: 3299,
    sizing: "women",
    washes: ["Light Blue", "Mid Blue"],
    tags: ["women", "straight"],
    isBestSeller: true,
  },
  {
    name: "Sample Women's Wide Leg Jeans",
    slug: "sample-womens-wide-leg-jeans",
    sku: "YMJ-SMP-008",
    category: "women-wide-leg",
    fit: "Wide leg",
    rise: "High",
    stretch: "No stretch",
    fabric: RIGID,
    basePrice: 4499,
    sizing: "women",
    washes: ["Light Blue", "Dark Indigo"],
    tags: ["women", "wide leg"],
    isNew: true,
  },
  {
    name: "Sample Women's Mom Jeans",
    slug: "sample-womens-mom-jeans",
    sku: "YMJ-SMP-009",
    category: "women-mom",
    fit: "Mom",
    rise: "High",
    stretch: "No stretch",
    fabric: RIGID,
    basePrice: 3699,
    sizing: "women",
    washes: ["Light Blue", "Mid Blue"],
    tags: ["women", "mom", "vintage"],
  },
  {
    name: "Sample Boys' Slim Jeans",
    slug: "sample-boys-slim-jeans",
    sku: "YMJ-SMP-010",
    category: "kids-boys",
    fit: "Slim",
    rise: "Mid",
    stretch: "Comfort stretch",
    fabric: COTTON_STRETCH,
    basePrice: 1999,
    sizing: "kids",
    washes: ["Mid Blue", "Black"],
    tags: ["kids", "boys"],
    isNew: true,
  },
  {
    name: "Sample Girls' Skinny Jeans",
    slug: "sample-girls-skinny-jeans",
    sku: "YMJ-SMP-011",
    category: "kids-girls",
    fit: "Skinny",
    rise: "Mid",
    stretch: "Super stretch",
    fabric: "75% cotton, 23% polyester, 2% elastane",
    basePrice: 1899,
    salePrice: 1599,
    sizing: "kids",
    washes: ["Light Blue", "Black"],
    tags: ["kids", "girls"],
    isBestSeller: true,
  },
  {
    name: "Sample Unisex Baggy Jeans",
    slug: "sample-unisex-baggy-jeans",
    sku: "YMJ-SMP-012",
    category: "unisex",
    fit: "Baggy",
    rise: "Mid",
    stretch: "No stretch",
    fabric: RIGID,
    basePrice: 4299,
    sizing: "men",
    washes: ["Light Blue", "Black"],
    tags: ["unisex", "baggy"],
    isFeatured: true,
  },
];

// Deterministic sample stock so the shop shows in-stock, low-stock and sold-out variants.
function sampleStock(productIndex: number, variantIndex: number): number {
  const n = (productIndex * 7 + variantIndex * 3) % 11;
  if (n === 0) return 0;
  if (n <= 2) return n + 1;
  return n + 4;
}

async function main() {
  // Sizes
  const jeansSizes = [...grid(MEN_WAISTS, MEN_LENGTHS), ...grid(WOMEN_WAISTS, WOMEN_LENGTHS)];
  await db.size.createMany({
    data: [
      ...jeansSizes.map((s) => ({ ...s, sortOrder: s.waist * 100 + s.length })),
      ...KIDS_SIZES.map((label, i) => ({ label, sortOrder: i + 1 })),
    ],
    skipDuplicates: true,
  });
  const sizes = await db.size.findMany();
  const sizeId = new Map(sizes.map((s) => [s.label, s.id]));

  // Washes
  await db.colour.createMany({
    data: WASHES.map(({ name, hex }) => ({ name, hex })),
    skipDuplicates: true,
  });
  const colourId = new Map((await db.colour.findMany()).map((c) => [c.name, c.id]));

  // Categories
  const categoryId = new Map<string, string>();
  for (const c of CATEGORIES) {
    const parentId = "parent" in c ? categoryId.get(c.parent) : undefined;
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, name: c.name, sortOrder: c.sortOrder, parentId },
    });
    categoryId.set(c.slug, row.id);
  }

  // Size charts
  const charts = {
    men: { name: "Sample Men's Jeans Size Chart", columns: DEFAULT_JEANS_COLUMNS, rows: MEN_CHART },
    women: {
      name: "Sample Women's Jeans Size Chart",
      columns: DEFAULT_JEANS_COLUMNS,
      rows: WOMEN_CHART,
    },
    kids: { name: "Sample Kids' Jeans Size Chart", columns: KIDS_COLUMNS, rows: KIDS_CHART },
  };
  const chartId: Record<string, string> = {};
  for (const [key, c] of Object.entries(charts)) {
    const row = await db.sizeChart.upsert({
      where: { name: c.name },
      update: {},
      create: {
        name: c.name,
        columns: c.columns,
        rows: c.rows,
        notes:
          "SAMPLE MEASUREMENTS. Replace with real measurements. Inside leg equals the L in the size (e.g. L30 = 30 inches).",
      },
    });
    chartId[key] = row.id;
  }

  // Products and variants
  for (const [pIndex, p] of PRODUCTS.entries()) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description:
          "This is a sample product created by the seed script. Replace the name, description, photos, price and stock from the admin panel.",
        careDetails: "Sample care details: machine wash cold, inside out. Do not tumble dry.",
        fabric: p.fabric,
        fit: p.fit,
        rise: p.rise,
        stretch: p.stretch,
        basePrice: p.basePrice,
        salePrice: p.salePrice ?? null,
        categoryId: categoryId.get(p.category)!,
        sizeChartId: chartId[p.sizing],
        tags: p.tags,
        isNew: p.isNew ?? false,
        isBestSeller: p.isBestSeller ?? false,
        isFeatured: p.isFeatured ?? false,
      },
    });

    const labels =
      p.sizing === "kids"
        ? KIDS_SIZES
        : p.sizing === "women"
          ? grid(WOMEN_WAISTS, WOMEN_LENGTHS).map((s) => s.label)
          : grid(MEN_WAISTS, MEN_LENGTHS).map((s) => s.label);
    let vIndex = 0;
    const variants = labels.flatMap((label) =>
      p.washes.map((wash) => {
        const code = WASHES.find((w) => w.name === wash)!.code;
        return {
          productId: product.id,
          sizeId: sizeId.get(label)!,
          colourId: colourId.get(wash)!,
          sku: `${p.sku}-${label.replace(/\s+/g, "")}-${code}`.toUpperCase(),
          stock: sampleStock(pIndex, vIndex++),
        };
      }),
    );
    await db.variant.createMany({ data: variants, skipDuplicates: true });
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
  if ((await db.banner.count()) === 0) {
    await db.banner.createMany({
      data: [
        {
          title: "Find your perfect fit",
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
    const existing = await db.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await db.user.create({
        data: { email: adminEmail, name: "Admin", passwordHash, role: Role.ADMIN },
      });
    }
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
