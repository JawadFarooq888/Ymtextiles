# YM Textiles

E-commerce site for YM Textiles: Pakistani garments sold in the UK. It supports ordering on WhatsApp and Stripe checkout.

Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS + shadcn/ui, Prisma + Neon Postgres, Auth.js, Stripe, Cloudinary, Resend. It is hosted on Vercel.

## Local setup

1. Install Node.js 20.9 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in at least `DATABASE_URL` and `DIRECT_URL` from your Neon project.
4. Run `npm run dev` and open http://localhost:3000.
5. Check the database connection at http://localhost:3000/api/health.

## Scripts

| Script                                  | Purpose                                             |
| --------------------------------------- | --------------------------------------------------- |
| `npm run dev`                           | Start the dev server                                |
| `npm run build`                         | Generate the Prisma client and build for production |
| `npm run lint` / `typecheck` / `format` | Code quality                                        |
| `npm run db:migrate`                    | Create and apply a migration (development)          |
| `npm run db:deploy`                     | Apply migrations (production)                       |
| `npm run db:seed`                       | Seed sample data                                    |

## Admin panel

- Sign in at `/admin` with the admin account created by `npm run db:seed` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
- To add another admin or staff login: `npm run admin:create -- someone@example.com "a-strong-password" STAFF`
- **Products**: create or edit a product, upload photos (drag to reorder), then under _Sizes, colours and stock_ tick sizes and colours and click **Generate variants**. Set the stock for each row and save.
- **Pages** (About, Delivery & Returns, policies...): _Pages_. Edit the text with the live preview, or add new pages.
- **Home page text, footer tagline, menu items, Google title/description, dispatch times**: _Settings_.
- **Staff logins**: _Users_ (admins only). Change your own password by clicking your email at the top right.
- **Newsletter**: _Newsletter_ → Export CSV.
- **Bulk changes**: _Products → Export CSV_, edit the file in Excel or Google Sheets, then _Import CSV_.
- **WhatsApp number, delivery fees, free delivery threshold**: _Settings_.

## Tests

```bash
npm test           # unit tests (Vitest)
npm run build
npm run test:e2e   # starts the production server on port 3123 and runs Playwright
```

More documentation (adding products, changing the WhatsApp number, deployment) will be added in Phase 8.
