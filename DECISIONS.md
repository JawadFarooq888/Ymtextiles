# Decisions

Judgement calls and deviations from `docs/BUILD_SPEC.md`.

## Phase 1: Setup

- **Next.js 15.5** (pinned via `create-next-app@15`), as specified, although newer majors exist.
- **Prisma 6** rather than Prisma 7. Prisma 6 supports Neon's pooled `DATABASE_URL` plus a direct `DIRECT_URL` for migrations with no driver adapter, which keeps setup simple.
- **Tailwind CSS v4** (the create-next-app default). Theme tokens live in `src/app/globals.css` as CSS variables, so there is no `tailwind.config.ts`.
- **shadcn/ui** with the `radix-nova` style. The brand palette overrides shadcn's tokens: primary = deep green, background = ivory, secondary/muted = sand, ring = gold, destructive = sale red. `--radius` is 1rem, which gives the 16px card radius.
- **Light theme only.** The design system defines one palette, so the shadcn dark-mode tokens were removed.
- **npm 11 `allowScripts`**: install scripts are allow-listed in `package.json` for Prisma, esbuild and unrs-resolver. Bump those entries when upgrading these packages.
- `.env*` is git-ignored except `.env.example`.
- `GET /api/health` runs `SELECT 1` to confirm the database connection.
