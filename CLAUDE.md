# YM Textiles

Online shop for **jeans** (men, women, kids, unisex), UK, GBP. Sizes are waist + length (W32 L30).

**Warning:** `.env` points at the LIVE production database. Never pass it as a Prisma shadow database or run reset commands. Migrations must be additive; generate SQL with `prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script`.

The full build specification is in `docs/BUILD_SPEC.md`. Follow it, phase by phase.
Record any deviation or judgement call in `DECISIONS.md`.

Key rules:

- TypeScript strict, no `any` without a reason comment.
- Money is integer pence; format with `src/lib/money.ts`.
- DB access only in `src/features/*/queries.ts` or service files.
- Business values (WhatsApp number, delivery fees, thresholds) come from the `Settings` table, never hard-coded.
- Seed data must be clearly marked as sample data.
