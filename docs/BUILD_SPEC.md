# Build Prompt: YM Textiles E-commerce Website (Next.js)

Copy everything below this line and paste it into Claude Code (or save it as `CLAUDE.md` in the project root).

---

## 1. Role and goal

You are a senior full-stack engineer. Build a production-ready e-commerce website for **YM Textiles**, a UK-based business that imports Pakistani garments (lawn suits, ready to wear, unstitched fabric, formal and wedding wear, menswear) and sells them to customers in the United Kingdom.

The site must let a customer:

1. Browse and filter products.
2. Select size, colour and quantity on a product page.
3. Order in **two ways**:
   - **Order on WhatsApp**: opens WhatsApp with a pre-filled message containing exactly what the customer selected.
   - **Normal checkout**: card payment through Stripe.

The owner must manage everything (products, categories, sizes, colours, stock, orders, banners, settings) from an admin panel. Nothing runs on a local machine in production. Everything is hosted in the cloud.

Reference for structure and features (not for copying design, images or text): **Khaadi UK (uk.khaadi.com)**. Take the patterns: announcement bar, mega menu with sub-categories, hero banner, "New In" and "Best Sellers" sections, product cards with sale price, filters, footer with help links and newsletter. Do not copy their logo, photos, copy or exact styling.

## 2. How you should work

- Work in the **phases** listed in section 11. Finish and verify each phase before starting the next.
- At the start, show me a short plan and the folder structure, then begin.
- Use TypeScript everywhere with `strict: true`. No `any` unless commented with a reason.
- Never hard-code business values (WhatsApp number, delivery fees, free delivery threshold, currency text). They come from the database `Settings` table or environment variables.
- Never invent product data, prices or claims. Use clearly marked seed data (for example "Sample Lawn Suit") that the owner will replace.
- Commit after each completed phase with a clear message.
- When something is unclear, choose the simplest sensible option, write it down in `DECISIONS.md`, and continue.

## 3. Tech stack (use exactly this unless you have a strong reason, then note it in DECISIONS.md)

| Layer        | Choice                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Framework    | Next.js 15, App Router, React Server Components, Server Actions                                           |
| Language     | TypeScript                                                                                                |
| Styling      | Tailwind CSS + shadcn/ui components                                                                       |
| Database     | PostgreSQL on Neon (serverless)                                                                           |
| ORM          | Prisma                                                                                                    |
| Auth         | Auth.js (NextAuth v5): admin login with email + password (hashed with bcrypt), optional customer accounts |
| Images       | Cloudinary (upload from admin, automatic resizing, WebP/AVIF)                                             |
| Payments     | Stripe Checkout + Stripe webhooks (cards, Apple Pay, Google Pay, Klarna)                                  |
| Emails       | Resend + React Email (order confirmation, admin new-order alert)                                          |
| Validation   | Zod (shared between forms and server actions)                                                             |
| Client state | Zustand for the basket, persisted to localStorage                                                         |
| Forms        | React Hook Form + Zod resolver                                                                            |
| Testing      | Vitest (unit), Playwright (end-to-end)                                                                    |
| Hosting      | Vercel (production + preview deployments)                                                                 |
| Analytics    | Vercel Analytics + optional GA4 through a consent-aware loader                                            |

## 4. Architecture

Use a feature-based structure with a clear split between UI, server logic and data access.

```
src/
  app/
    (shop)/
      page.tsx                      Home
      collections/[slug]/page.tsx   Category listing with filters
      products/[slug]/page.tsx      Product detail
      basket/page.tsx
      checkout/success/page.tsx
      search/page.tsx
      account/...                   Optional customer area
      pages/[slug]/page.tsx         Static pages (Size Guide, Delivery & Returns, About, Contact, Privacy, Terms)
    (admin)/admin/
      layout.tsx                    Protected by middleware
      page.tsx                      Dashboard
      products/...                  List, create, edit, bulk import (CSV)
      categories/...
      attributes/...                Sizes and colours
      orders/...                    All orders incl. WhatsApp orders
      banners/...
      settings/page.tsx
    api/
      stripe/webhook/route.ts
      revalidate/route.ts
    layout.tsx
    sitemap.ts
    robots.ts
  features/
    catalog/      components, queries, types
    product/      ProductGallery, VariantSelector, AddToBasket, WhatsAppOrderButton
    basket/       store (Zustand), BasketDrawer, BasketLine
    checkout/     createCheckoutSession action, webhook handler
    whatsapp/     buildWhatsAppMessage, buildWhatsAppUrl, createWhatsAppOrder action
    orders/       order service, status transitions
    admin/        admin-only components and actions
  components/ui/  shadcn/ui primitives
  lib/
    db.ts         Prisma client singleton
    auth.ts
    money.ts      Pence <-> GBP formatting (all money stored as integer pence)
    cloudinary.ts
    stripe.ts
    settings.ts   Cached settings loader
  emails/         React Email templates
  styles/
prisma/
  schema.prisma
  seed.ts
tests/
  unit/
  e2e/
```

Rules:

- Database access only inside `features/*/queries.ts` or service files, never directly in components.
- All mutations go through Server Actions with Zod validation and an auth check where needed.
- Catalogue pages use static rendering with `revalidateTag` after admin edits, so pages are fast and still update instantly when the owner changes a product.
- Money is always stored as integer pence. Display with `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`.

## 5. Data model (Prisma, adjust names if needed but keep the concepts)

- **Category**: id, name, slug, parentId (for sub-categories like Ready to Wear > 3 Piece), image, sortOrder, isActive.
- **Product**: id, name, slug, sku, description (rich text), fabric (Lawn, Chiffon, Cambric, Khaddar, Organza...), pieces (1, 2, 3 piece), type (Stitched / Unstitched), basePrice, salePrice (nullable), categoryId, tags, isFeatured, isBestSeller, isNew, isActive, seoTitle, seoDescription, createdAt.
- **ProductImage**: id, productId, url, alt, sortOrder, colourId (optional, so selecting a colour switches the gallery).
- **Size**: id, label (XS, S, M, L, XL, XXL, or Unstitched), sortOrder. Admin managed.
- **Colour**: id, name, hex. Admin managed.
- **Variant**: id, productId, sizeId, colourId, sku, stock, priceOverride (nullable). Unique on (productId, sizeId, colourId).
- **SizeChart**: id, name, rows as JSON (chest, length, sleeve, shalwar/trouser length in inches and cm). Linked to products.
- **Order**: id, orderNumber (human friendly, e.g. YM-10234), channel (`WEBSITE` | `WHATSAPP`), status (`PENDING` | `AWAITING_WHATSAPP_CONFIRMATION` | `PAID` | `PROCESSING` | `SHIPPED` | `DELIVERED` | `CANCELLED` | `REFUNDED`), customerName, email, phone, address fields (line1, line2, city, postcode, country default GB), subtotal, deliveryFee, discount, total, stripeSessionId, notes, createdAt.
- **OrderItem**: id, orderId, productId, variantId, productName, size, colour, quantity, unitPrice (snapshot at order time).
- **Banner**: id, title, subtitle, image, ctaText, ctaUrl, placement (`HERO` | `ANNOUNCEMENT`), isActive, sortOrder.
- **Settings** (single row): whatsappNumber (E.164, e.g. 447XXXXXXXXX), whatsappGreeting, freeDeliveryThreshold, standardDeliveryFee, expressDeliveryFee, announcementText, instagramUrl, tiktokUrl, facebookUrl, businessAddress, returnsDays.
- **AdminUser** / **User**: Auth.js tables plus role (`ADMIN` | `STAFF` | `CUSTOMER`).
- **NewsletterSubscriber**: email, createdAt, consent timestamp.

## 6. WhatsApp ordering (most important feature)

### 6.1 On the product page

1. Customer selects **size**, **colour** and **quantity** using the `VariantSelector`.
2. Out-of-stock combinations are shown disabled with a "Sold out" label.
3. The **"Order on WhatsApp"** button stays disabled until size and colour are chosen. If clicked early, show an inline message "Please select a size and colour".
4. On click:
   - Call the `createWhatsAppOrder` Server Action. It validates the selection and stock, creates an `Order` with `channel = WHATSAPP` and `status = AWAITING_WHATSAPP_CONFIRMATION`, and returns the order number.
   - Build the message with `buildWhatsAppMessage()` and open `https://wa.me/<whatsappNumber>?text=<encodeURIComponent(message)>` in a new tab. On mobile this opens the WhatsApp app directly.

Message format (plain text, line breaks preserved):

```
Hi YM Textiles, I would like to order:

Order ref: YM-10234
Product: Embroidered Lawn 3 Piece
SKU: YM-LWN-001-M-GRN
Size: M
Colour: Green
Quantity: 2
Price: £45.00 each
Total: £90.00

Link: https://ymtextiles.co.uk/products/embroidered-lawn-3-piece

Please confirm availability and delivery.
```

### 6.2 From the basket (multiple items)

- The basket page has two buttons: **"Checkout securely"** (Stripe) and **"Order whole basket on WhatsApp"**.
- WhatsApp basket order opens a small form first: name, phone, postcode, optional note (Zod validated, UK postcode regex).
- Creates one `Order` with all items, then opens WhatsApp with a message listing every item (product, size, colour, qty, line total), subtotal, delivery fee, grand total, customer name and postcode, and the order ref.
- Keep the message under WhatsApp URL limits. If the basket is very long, send a short message with the order ref and a private link to view the order summary (`/order/[token]`, token is an unguessable random string).

### 6.3 Floating WhatsApp button

- A floating WhatsApp button on every shop page (bottom right, 56px, accessible label). On product pages it pre-fills "Hi, I have a question about <product name> (<link>)".

### 6.4 Admin side

- Orders list has a filter for channel (Website / WhatsApp) and status.
- WhatsApp orders show a **"Confirm"** button (moves to PROCESSING and reduces stock), **"Cancel"** button, and a **"Message customer"** button that opens WhatsApp to the customer's phone.
- Stock is only reduced when a WhatsApp order is confirmed, or when a Stripe payment succeeds.
- Unconfirmed WhatsApp orders older than 72 hours are marked as `CANCELLED` by a Vercel Cron job.

### 6.5 Code requirements

- `buildWhatsAppMessage(order, settings)` and `buildWhatsAppUrl(number, message)` are pure functions with unit tests (encoding, £ formatting, line breaks, long baskets).
- WhatsApp number comes only from `Settings`, editable in admin.

## 7. Normal checkout (Stripe)

- Server Action `createCheckoutSession` re-reads prices and stock from the database (never trust client prices), creates a `PENDING` order, then creates a Stripe Checkout Session in GBP with UK shipping address collection and the delivery options from Settings (free above the threshold).
- Webhook `/api/stripe/webhook` verifies the signature, then on `checkout.session.completed` marks the order `PAID`, reduces stock in a transaction, sends the confirmation email to the customer and an alert email to the admin.
- Handle idempotency (the same webhook can arrive twice).
- Success page shows order number and summary. Cancel returns to the basket with items intact.

## 8. Pages and UI

**Shop**

- **Announcement bar** (text from Banner / Settings).
- **Header**: logo "YM TEXTILES", mega menu (New In, Ready to Wear, Unstitched, Lawn, Formal & Wedding, Men, Sale) with sub-categories from the database, search, account, basket icon with count, basket slide-out drawer.
- **Home**: hero banner carousel (admin managed), Shop by Category, New Arrivals, Best Sellers, "Why YM Textiles" (Sourced in Pakistan, Stocked in the UK, Real measurements, Help on WhatsApp), WhatsApp help banner, newsletter signup, footer.
- **Collection page**: filters (size, colour, fabric, pieces, stitched/unstitched, price range), sort (newest, price low-high, high-low, best sellers), pagination or "Load more", filters stored in URL search params so links are shareable.
- **Product page**: image gallery with zoom and swipe on mobile, name, price with sale price and % off, variant selector, quantity, stock message ("Only 3 left"), Add to Basket, Order on WhatsApp, size chart modal (inches and cm), fabric and care details, delivery and returns accordion, "You may also like".
- **Search**: Postgres full-text search on name, fabric, tags.
- Static pages: Size Guide, Delivery & Returns, About, Contact (with WhatsApp and email), Privacy Policy, Terms, Cookie Policy.

**Admin**

- Dashboard: today's orders, pending WhatsApp orders, low stock list, revenue this week.
- Products: table with search and filters, create/edit form with multi-image upload (drag to reorder), variant matrix generator (pick sizes and colours, it creates all variants, then edit stock per row), CSV bulk import and export for 200+ products.
- Categories (nested), Sizes, Colours, Size Charts, Banners, Settings, Orders, Newsletter subscribers (export CSV).
- Every admin route protected by middleware and a server-side role check.

**Design system** (from the approved mockup)

- Colours: deep green `#1F4D3F` (primary), ivory `#FBF8F2` (background), sand `#F2EADB` (section background), gold `#B8862E` (accent), dark text `#16332A`, body text `#4A5651`, sale red `#A3412F`.
- Fonts: Cormorant Garamond (headings), Jost (body), loaded with `next/font`.
- Rounded pill buttons, 16px card radius, generous spacing.
- Mobile first. Touch targets at least 44px. Test at 375px width.

## 9. UK and legal requirements

- Prices shown in GBP, VAT inclusive.
- UK postcode validation, country fixed to United Kingdom for checkout (configurable later).
- Cookie consent banner (UK GDPR / PECR). Analytics only load after consent.
- 14-day returns information (Consumer Contracts Regulations) shown on product and returns page.
- Privacy policy and terms pages with placeholder text clearly marked `[TO BE REVIEWED BY OWNER]`.

## 10. Quality, SEO and security

- **Performance**: Lighthouse 90+ on mobile for home, collection and product pages. Use `next/image`, Cloudinary transformations, lazy loading.
- **SEO**: metadata per page, Open Graph images, `Product` JSON-LD with price, availability and GBP currency, `BreadcrumbList` JSON-LD, `sitemap.xml`, `robots.txt`, clean slugs, canonical URLs.
- **Accessibility**: semantic HTML, labels on all inputs, visible focus, alt text on all product images, colour contrast AA.
- **Security**: Zod validation on every action, rate limit public actions (WhatsApp order, newsletter, contact) using Upstash Ratelimit, CSRF safe Server Actions, Stripe webhook signature check, secrets only in env vars, admin passwords hashed, no stack traces shown to users.
- **Errors**: `error.tsx` and `not-found.tsx` with friendly messages and a WhatsApp help link.

## 11. Phases and acceptance criteria

1. **Setup**: Next.js, TypeScript, Tailwind, shadcn/ui, Prisma + Neon, ESLint, Prettier, Husky. `.env.example` with every variable. Done when the app runs and connects to the database.
2. **Data model and seed**: full Prisma schema, migrations, seed with 4 categories, sizes XS to XXL, 6 colours, 12 sample products with variants. Done when `prisma db seed` works.
3. **Admin panel**: login, products with images and variant matrix, categories, sizes, colours, size charts, banners, settings, CSV import. Done when the owner can add a product end to end and see it on the shop.
4. **Shop front**: header, mega menu, home, collection with filters, product page, search, static pages. Done when browsing works on mobile and desktop.
5. **Basket and WhatsApp ordering**: basket store and drawer, product-page WhatsApp order, basket WhatsApp order, floating button, admin WhatsApp order handling, cron cleanup. Done when a WhatsApp order creates an order record and opens WhatsApp with the correct selected size, colour and quantity.
6. **Stripe checkout and emails**: checkout session, webhook, stock reduction, confirmation and admin emails. Done when a Stripe test payment completes and the order shows as PAID.
7. **SEO, accessibility, performance, cookie consent**. Done when Lighthouse targets are met.
8. **Tests and deployment**: unit tests for money, WhatsApp message builder, order totals; Playwright tests for (a) product page WhatsApp order, (b) basket WhatsApp order, (c) Stripe test checkout, (d) admin creating a product. Deploy to Vercel, connect domain, set env vars, set Stripe webhook URL. Write `README.md` with setup, env vars, how to add products, how to change the WhatsApp number.

## 12. Environment variables (put in `.env.example`)

```
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXT_PUBLIC_SITE_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
ADMIN_ALERT_EMAIL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

## 13. Owner details to fill in later (use placeholders until provided)

- WhatsApp business number: `[447XXXXXXXXX]`
- Domain: `[ymtextiles.co.uk]`
- Business address: `[UK ADDRESS]`
- Delivery fees and free delivery threshold: `[£ AMOUNTS]`
- Logo file and brand photos: `[TO BE PROVIDED]`

Start with Phase 1. Show me the plan and folder structure first, then build.
