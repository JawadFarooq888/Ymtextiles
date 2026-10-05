import type { Metadata } from "next";
import { SearchIcon } from "lucide-react";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { getCatalogIndex, searchProductIds } from "@/features/catalog/queries";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100);

  let results: Awaited<ReturnType<typeof getCatalogIndex>>["products"] = [];
  if (q) {
    const [ids, index] = await Promise.all([searchProductIds(q), getCatalogIndex()]);
    const byId = new Map(index.products.map((p) => [p.id, p]));
    results = ids.flatMap((id) => byId.get(id) ?? []);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl font-semibold">Search</h1>
      <form role="search" action="/search" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="search-q" className="sr-only">
          Search products
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={q}
          autoFocus={!q}
          placeholder="Try lawn, chiffon, embroidered..."
          className="h-12 flex-1 rounded-full border border-input bg-background px-5 text-base"
        />
        <button
          type="submit"
          className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          <SearchIcon className="size-4" aria-hidden /> Search
        </button>
      </form>

      {q ? (
        <section className="mt-10" aria-live="polite" aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">
            Search results
          </h2>
          <p className="mb-6 text-sm">
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <span className="font-medium text-brand-ink">&ldquo;{q}&rdquo;</span>
          </p>
          {results.length ? (
            <ProductGrid products={results} priorityCount={4} />
          ) : (
            <p className="rounded-2xl bg-secondary p-8 text-center">
              Nothing found. Try another word, such as a fabric (lawn, chiffon) or style.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
