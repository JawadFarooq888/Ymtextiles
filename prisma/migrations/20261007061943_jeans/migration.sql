-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "fit" TEXT,
ADD COLUMN     "rise" TEXT,
ADD COLUMN     "stretch" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "menuShowBestSellers" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "footerTagline" SET DEFAULT 'Jeans for men, women and kids, stocked in the UK.',
ALTER COLUMN "seoDescription" SET DEFAULT 'Jeans for men, women and kids in every fit: skinny, slim, straight and wide leg. Find your waist and length. UK delivery.',
ALTER COLUMN "seoTitle" SET DEFAULT 'YM Textiles | Jeans for Men, Women & Kids';

-- AlterTable
ALTER TABLE "Size" ADD COLUMN     "length" INTEGER,
ADD COLUMN     "waist" INTEGER;

-- AlterTable
ALTER TABLE "SizeChart" ADD COLUMN     "columns" JSONB NOT NULL DEFAULT '[]';

