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

More documentation (adding products, changing the WhatsApp number, deployment) will be added in Phase 8.
