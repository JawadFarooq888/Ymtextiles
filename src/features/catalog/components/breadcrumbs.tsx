import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={`${c.name}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRightIcon className="size-3" aria-hidden /> : null}
            {c.href ? (
              <Link
                href={c.href}
                className="inline-flex min-h-6 items-center hover:text-primary hover:underline"
              >
                {c.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-brand-ink">
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
