import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChevronDownIcon } from "lucide-react";
import { Breadcrumbs } from "@/features/catalog/components/breadcrumbs";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { getCatalogIndex, getProductBySlug } from "@/features/catalog/queries";
import { ProductPurchase } from "@/features/product/components/product-purchase";
import { SetFloatingWhatsAppMessage } from "@/features/whatsapp/floating-whatsapp";
import { getSiteUrl } from "@/lib/site";
import { SizeChartDialog } from "@/features/product/components/size-chart-dialog";
import { formatPence } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { cloudinaryUrl } from "@/lib/image";

type Params = Promise<{ slug: string }>;

const sizeChartRows = z.array(
  z.object({
    size: z.string(),
    chest: z.number(),
    length: z.number(),
    sleeve: z.number(),
    trouserLength: z.number(),
  }),
);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const description =
    product.seoDescription ??
    (product.description.slice(0, 155) || `${product.name} at YM Textiles.`);
  const image = product.images[0];
  return {
    title: product.seoTitle ?? product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image
        ? [{ url: cloudinaryUrl(image.url, 1200), alt: image.alt || product.name }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings, index] = await Promise.all([
    getProductBySlug(slug),
    getSettings(),
    getCatalogIndex(),
  ]);
  if (!product) notFound();

  const chartRows = product.sizeChart ? sizeChartRows.safeParse(product.sizeChart.rows) : null;
  const related = [
    ...index.products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id),
    ...index.products.filter(
      (p) => p.categoryId !== product.categoryId && p.fabric === product.fabric,
    ),
  ]
    .filter((p, i, all) => all.findIndex((x) => x.id === p.id) === i)
    .slice(0, 4);

  const crumbs = [
    { name: "Home", href: "/" },
    ...(product.category.parent
      ? [
          {
            name: product.category.parent.name,
            href: `/collections/${product.category.parent.slug}`,
          },
        ]
      : []),
    { name: product.category.name, href: `/collections/${product.category.slug}` },
    { name: product.name },
  ];

  const eyebrow = [
    product.fabric,
    product.pieces ? `${product.pieces} piece` : null,
    product.type === "UNSTITCHED" ? "Unstitched" : "Stitched",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SetFloatingWhatsAppMessage
        message={`Hi, I have a question about ${product.name} (${getSiteUrl()}/products/${product.slug})`}
      />
      <div className="mb-4">
        <Breadcrumbs items={crumbs} />
      </div>

      <ProductPurchase
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          images: product.images,
          variants: product.variants,
          image: product.images[0]?.url ?? null,
        }}
        lowStockThreshold={settings.lowStockThreshold}
        header={
          <>
            <p className="text-xs tracking-[0.2em] text-brand-gold-dark uppercase">{eyebrow}</p>
            <h1 className="mt-2 text-3xl leading-tight font-semibold md:text-4xl">
              {product.name}
            </h1>
          </>
        }
        sizeChartTrigger={
          product.sizeChart && chartRows?.success && chartRows.data.length ? (
            <SizeChartDialog
              name={product.sizeChart.name}
              rows={chartRows.data}
              notes={product.sizeChart.notes}
            />
          ) : (
            <Link
              href="/pages/size-guide"
              className="text-sm text-primary underline underline-offset-4"
            >
              Size guide
            </Link>
          )
        }
      >
        <div className="divide-y border-y">
          {product.description ? (
            <Accordion title="Description" defaultOpen>
              <p className="whitespace-pre-line">{product.description}</p>
            </Accordion>
          ) : null}
          <Accordion title="Fabric and care">
            <ul className="grid gap-1">
              {product.fabric ? <li>Fabric: {product.fabric}</li> : null}
              {product.pieces ? <li>{product.pieces} piece</li> : null}
              <li>
                {product.type === "UNSTITCHED" ? "Unstitched fabric" : "Stitched, ready to wear"}
              </li>
              <li>SKU: {product.sku}</li>
            </ul>
            {product.careDetails ? (
              <p className="mt-3 whitespace-pre-line">{product.careDetails}</p>
            ) : null}
          </Accordion>
          <Accordion title="Delivery and returns">
            <ul className="grid gap-1">
              <li>
                UK standard delivery: {formatPence(settings.standardDeliveryFee)}
                {settings.freeDeliveryThreshold > 0
                  ? `, free on orders over ${formatPence(settings.freeDeliveryThreshold)}`
                  : ""}
              </li>
              <li>UK express delivery: {formatPence(settings.expressDeliveryFee)}</li>
              <li>
                You have {settings.returnsDays} days from delivery to cancel and return your order
                (UK Consumer Contracts Regulations).
              </li>
            </ul>
            <Link
              href="/pages/delivery-returns"
              className="mt-3 inline-block text-primary underline underline-offset-4"
            >
              Delivery and returns details
            </Link>
          </Accordion>
        </div>
      </ProductPurchase>

      {related.length ? (
        <section className="mt-20" aria-labelledby="related">
          <h2 id="related" className="mb-6 text-3xl font-semibold">
            You may also like
          </h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}

function Accordion({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-medium text-brand-ink">
        {title}
        <ChevronDownIcon className="size-4 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-5 text-sm leading-relaxed">{children}</div>
    </details>
  );
}
