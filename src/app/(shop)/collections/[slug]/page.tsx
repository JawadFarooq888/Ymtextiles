import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/features/catalog/components/breadcrumbs";
import {
  DesktopFilters,
  MobileFilters,
  SortSelect,
} from "@/features/catalog/components/collection-filters";
import { Pagination } from "@/features/catalog/components/pagination";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { resolveCollection } from "@/features/catalog/collections";
import { applyFilters, facetOptions, parseFilters } from "@/features/catalog/filters";
import { getCatalogIndex, getCategoryTree } from "@/features/catalog/queries";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const collection = resolveCollection(slug, await getCategoryTree());
  if (!collection) return {};
  return {
    title: collection.title,
    description:
      collection.description ??
      `Shop ${collection.title} at YM Textiles. Jeans for men, women and kids, stocked in the UK.`,
    alternates: { canonical: `/collections/${slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, sp, tree, index] = await Promise.all([
    params,
    searchParams,
    getCategoryTree(),
    getCatalogIndex(),
  ]);
  const collection = resolveCollection(slug, tree);
  if (!collection) notFound();

  const filters = parseFilters(sp);
  const scope = index.products.filter(collection.match);
  const facets = facetOptions(scope, index);
  const { products, total, page, pageCount } = applyFilters(scope, filters, index);
  const basePath = `/collections/${slug}`;
  const crumbs = [
    { name: "Home", href: "/" },
    ...collection.parents.map((p) => ({ name: p.name, href: `/collections/${p.slug}` })),
    { name: collection.title },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-4 mb-6">
        <h1 className="text-4xl font-semibold md:text-5xl">{collection.title}</h1>
        {collection.description ? <p className="mt-2 max-w-2xl">{collection.description}</p> : null}
        {collection.children.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {collection.children.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="flex min-h-10 items-center rounded-full border bg-background px-4 text-sm hover:border-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <DesktopFilters filters={filters} facets={facets} />
        <section aria-labelledby="products-heading">
          <h2 id="products-heading" className="sr-only">
            Products
          </h2>
          <div className="mb-6 flex items-center justify-between gap-3">
            <MobileFilters filters={filters} facets={facets} total={total} />
            <p className="hidden text-sm lg:block" aria-live="polite">
              {total} product{total === 1 ? "" : "s"}
            </p>
            <SortSelect filters={filters} />
          </div>
          {products.length ? (
            <ProductGrid products={products} priorityCount={4} />
          ) : (
            <div className="rounded-2xl bg-secondary p-10 text-center">
              <p className="font-heading text-2xl text-brand-ink">
                No products match these filters
              </p>
              <p className="mt-2 text-sm">Try removing a filter, or browse everything.</p>
              <Link
                href={basePath}
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground"
              >
                Clear filters
              </Link>
            </div>
          )}
          <Pagination basePath={basePath} filters={filters} page={page} pageCount={pageCount} />
        </section>
      </div>
    </div>
  );
}
