import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DownloadIcon, PlusIcon, UploadIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/features/admin/components/page-header";
import { listCategoryOptions } from "@/features/admin/categories/service";
import { listProductsForAdmin, type AdminProductFilters } from "@/features/admin/products/service";
import { cloudinaryUrl } from "@/lib/image";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUSES = ["active", "inactive", "low-stock"] as const;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const status = one("status");
  const filters: AdminProductFilters = {
    q: one("q")?.slice(0, 100),
    categoryId: one("category"),
    status: STATUSES.find((s) => s === status),
    page: Number(one("page")) || 1,
  };
  const [{ products, total, page, pageCount }, categories] = await Promise.all([
    listProductsForAdmin(filters),
    listCategoryOptions(),
  ]);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.categoryId) params.set("category", filters.categoryId);
    if (filters.status) params.set("status", filters.status);
    params.set("page", String(p));
    return `/admin/products?${params}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} product(s)`}
        actions={
          <>
            <Button asChild variant="outline">
              <a href="/admin/products/export" download>
                <DownloadIcon /> Export CSV
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/products/import">
                <UploadIcon /> Import CSV
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/products/new">
                <PlusIcon /> New product
              </Link>
            </Button>
          </>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder="Search name or SKU"
          aria-label="Search products"
          className="w-full sm:w-64"
        />
        <select
          name="category"
          defaultValue={filters.categoryId ?? ""}
          aria-label="Filter by category"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          aria-label="Filter by status"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Any status</option>
          <option value="active">Visible</option>
          <option value="inactive">Hidden</option>
          <option value="low-stock">Low stock</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {filters.q || filters.categoryId || filters.status ? (
          <Button asChild variant="ghost">
            <Link href="/admin/products">Clear</Link>
          </Button>
        ) : null}
      </form>

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">
                <span className="sr-only">Photo</span>
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden sm:table-cell">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="relative h-14 w-11 overflow-hidden rounded-md bg-muted">
                    {p.images[0] ? (
                      <Image
                        src={cloudinaryUrl(p.images[0].url, 100)}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-64">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="block truncate font-medium text-brand-ink hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{p.sku}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {p.category.name}
                </TableCell>
                <TableCell>
                  {p.salePrice !== null ? (
                    <>
                      <span className="text-brand-sale">{formatPence(p.salePrice)}</span>{" "}
                      <s className="text-xs text-muted-foreground">{formatPence(p.basePrice)}</s>
                    </>
                  ) : (
                    formatPence(p.basePrice)
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {p.totalStock}
                  <span className="text-xs text-muted-foreground"> / {p.variantCount} var.</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={p.isActive ? "secondary" : "outline"}>
                      {p.isActive ? "Visible" : "Hidden"}
                    </Badge>
                    {p.lowStock ? <Badge variant="destructive">Low stock</Badge> : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>Next</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
