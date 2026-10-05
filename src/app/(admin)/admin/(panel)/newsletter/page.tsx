import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/features/admin/components/page-header";
import { SubscriberActions } from "@/features/admin/newsletter/subscriber-actions";
import { listSubscribers } from "@/features/admin/newsletter/service";
import { formatLondonDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Newsletter" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewsletterPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const { subscribers, active, pageCount } = await listSubscribers(q, page);
  const pageHref = (p: number) =>
    `/admin/newsletter?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <PageHeader
        title="Newsletter"
        description={`${active} active subscriber(s)`}
        actions={
          <Button asChild variant="outline">
            <a href="/admin/newsletter/export" download>
              <DownloadIcon /> Export CSV
            </a>
          </Button>
        }
      />
      <form className="mb-4 flex gap-2" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search email"
          aria-label="Search subscribers"
          className="w-full sm:w-72"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <ul className="divide-y rounded-2xl border bg-card">
        {subscribers.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-brand-ink">{s.email}</p>
              <p className="text-xs text-muted-foreground">
                Consent {formatLondonDateTime(s.consentAt)}
                {s.source ? ` · via ${s.source}` : ""}
              </p>
            </div>
            <Badge variant={s.unsubscribedAt ? "outline" : "secondary"}>
              {s.unsubscribedAt ? "Unsubscribed" : "Active"}
            </Badge>
            <SubscriberActions id={s.id} email={s.email} unsubscribed={!!s.unsubscribedAt} />
          </li>
        ))}
        {subscribers.length === 0 ? (
          <li className="p-8 text-center text-sm text-muted-foreground">No subscribers yet.</li>
        ) : null}
      </ul>
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
