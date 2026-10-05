import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/features/catalog/queries";
import { cloudinaryUrl } from "@/lib/image";
import { formatPence, percentOff } from "@/lib/money";

// Interim product page (Phase 3). The full design with variant selector,
// basket and WhatsApp ordering replaces this in Phases 4 and 5.

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const price = product.salePrice ?? product.basePrice;
  const sizes = [...new Map(product.variants.map((v) => [v.size.id, v.size])).values()];
  const colours = [...new Map(product.variants.map((v) => [v.colour.id, v.colour])).values()];

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
      <div className="grid gap-3">
        {product.images.length ? (
          product.images.map((img, i) => (
            <div
              key={img.id}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary"
            >
              <Image
                src={cloudinaryUrl(img.url, 900)}
                alt={img.alt || product.name}
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-secondary text-sm text-muted-foreground">
            Photo coming soon
          </div>
        )}
      </div>
      <div>
        <p className="text-xs tracking-[0.2em] text-brand-gold uppercase">
          {product.category.name}
        </p>
        <h1 className="mt-2 text-4xl font-semibold">{product.name}</h1>
        <p className="mt-3 text-xl">
          {product.salePrice !== null ? (
            <>
              <span className="font-medium text-brand-sale">{formatPence(price)}</span>{" "}
              <s className="text-base text-muted-foreground">{formatPence(product.basePrice)}</s>{" "}
              <span className="text-sm text-brand-sale">
                {percentOff(product.basePrice, product.salePrice)}% off
              </span>
            </>
          ) : (
            formatPence(price)
          )}
        </p>
        <dl className="mt-6 grid gap-2 text-sm">
          {product.fabric ? (
            <div>
              <dt className="inline font-medium">Fabric: </dt>
              <dd className="inline">{product.fabric}</dd>
            </div>
          ) : null}
          {sizes.length ? (
            <div>
              <dt className="inline font-medium">Sizes: </dt>
              <dd className="inline">{sizes.map((s) => s.label).join(", ")}</dd>
            </div>
          ) : null}
          {colours.length ? (
            <div>
              <dt className="inline font-medium">Colours: </dt>
              <dd className="inline">{colours.map((c) => c.name).join(", ")}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-6 whitespace-pre-line">{product.description}</p>
      </div>
    </main>
  );
}
