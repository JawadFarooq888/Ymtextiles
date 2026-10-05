import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/components/page-header";
import { listPages } from "@/features/admin/pages/service";
import { SYSTEM_PAGE_SLUGS } from "@/features/content/defaults";
import { formatLondonDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Pages" };
export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const pages = await listPages();
  return (
    <>
      <PageHeader
        title="Pages"
        description="Information pages shown in the footer: About, Delivery & Returns, policies and any pages you add."
        actions={
          <Button asChild>
            <Link href="/admin/pages/new">
              <PlusIcon /> New page
            </Link>
          </Button>
        }
      />
      <ul className="divide-y rounded-2xl border bg-card">
        {pages.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/pages/${p.id}`}
                className="font-medium text-brand-ink hover:underline"
              >
                {p.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                /pages/{p.slug} · updated {formatLondonDateTime(p.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {SYSTEM_PAGE_SLUGS.has(p.slug) ? <Badge variant="outline">Built-in</Badge> : null}
              <Badge variant={p.isPublished ? "secondary" : "outline"}>
                {p.isPublished ? "Published" : "Hidden"}
              </Badge>
            </div>
            <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${p.title}`}>
              <Link href={`/admin/pages/${p.id}`}>
                <PencilIcon />
              </Link>
            </Button>
          </li>
        ))}
        {pages.length === 0 ? (
          <li className="p-8 text-center text-sm text-muted-foreground">
            No pages yet. Run the seed to add the standard pages.
          </li>
        ) : null}
      </ul>
    </>
  );
}
