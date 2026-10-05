import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/features/catalog/types";
import { Price } from "@/features/catalog/components/price";
import { ImagePlaceholder } from "@/features/catalog/components/image-placeholder";
import { cloudinaryUrl } from "@/lib/image";
import { percentOff } from "@/lib/money";

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const [first, second] = product.images;
  const onSale = product.salePrice !== null;

  return (
    <article className="group relative">
      <Link
        href={`/products/${product.slug}`}
        className="block rounded-2xl focus-visible:outline-2"
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary">
          {first ? (
            <>
              <Image
                src={cloudinaryUrl(first.url, 600)}
                alt={first.alt || product.name}
                fill
                priority={priority}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              {second ? (
                <Image
                  src={cloudinaryUrl(second.url, 600)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <ImagePlaceholder label={product.name} />
          )}
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {onSale ? (
              <span className="rounded-full bg-brand-sale px-2 py-0.5 text-[11px] font-medium text-white">
                -{percentOff(product.basePrice, product.salePrice!)}%
              </span>
            ) : null}
            {product.isNew ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                New
              </span>
            ) : null}
          </div>
          {!product.inStock ? (
            <span className="absolute inset-x-2 bottom-2 rounded-full bg-background/90 py-1 text-center text-xs font-medium text-brand-ink">
              Sold out
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid gap-1 px-1">
          <h3 className="line-clamp-2 font-sans text-sm leading-snug font-normal text-brand-ink">
            {product.name}
          </h3>
          <Price basePrice={product.basePrice} salePrice={product.salePrice} />
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: CatalogProduct[];
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
