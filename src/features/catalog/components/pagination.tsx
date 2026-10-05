import Link from "next/link";
import { filtersToQuery, type Filters } from "@/features/catalog/filters";
import { cn } from "@/lib/utils";

export function Pagination({
  basePath,
  filters,
  page,
  pageCount,
}: {
  basePath: string;
  filters: Filters;
  page: number;
  pageCount: number;
}) {
  if (pageCount < 2) return null;
  const href = (p: number) => `${basePath}${filtersToQuery(filters, { page: p })}`;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  const item = "flex size-11 items-center justify-center rounded-full text-sm";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "w-auto px-4 hover:bg-secondary")}>
          Previous
        </Link>
      ) : null}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 ? (
            <span className="px-1 text-muted-foreground">…</span>
          ) : null}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              item,
              p === page ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(item, "w-auto px-4 hover:bg-secondary")}>
          Next
        </Link>
      ) : null}
    </nav>
  );
}
