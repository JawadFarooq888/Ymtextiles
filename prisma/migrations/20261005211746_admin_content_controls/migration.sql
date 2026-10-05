-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "dispatchInfo" TEXT,
ADD COLUMN     "footerTagline" TEXT NOT NULL DEFAULT 'Pakistani clothing, sourced in Pakistan and stocked in the UK.',
ADD COLUMN     "menuShowLawn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "menuShowNewIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "menuShowSale" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "seoDescription" TEXT NOT NULL DEFAULT 'Lawn suits, ready to wear, unstitched fabric, formal and wedding wear, and menswear. Sourced in Pakistan, stocked in the UK.',
ADD COLUMN     "seoTitle" TEXT NOT NULL DEFAULT 'YM Textiles | Pakistani Clothing in the UK',
ADD COLUMN     "whatsappUkOnly" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whyUs" JSONB;

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
