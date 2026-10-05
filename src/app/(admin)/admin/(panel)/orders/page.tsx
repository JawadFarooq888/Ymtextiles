import type { Metadata } from "next";
import Link from "next/link";
import type { OrderChannel, OrderStatus } from "@prisma/client";
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
import { StatusBadge } from "@/features/admin/orders/status-badge";
import { listOrders } from "@/features/orders/service";
import { STATUS_LABELS } from "@/features/orders/status";
import { formatLondonDateTime } from "@/lib/dates";
import { formatPence } from "@/lib/money";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const CHANNELS: OrderChannel[] = ["WEBSITE", "WHATSAPP"];
const STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const channel = CHANNELS.find((c) => c === one("channel"));
  const status = STATUSES.find((s) => s === one("status"));
  const q = one("q")?.slice(0, 100);
  const { orders, total, page, pageCount } = await listOrders({
    channel,
    status,
    q,
    page: Number(one("page")) || 1,
  });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (channel) params.set("channel", channel);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/admin/orders?${params}`;
  };

  return (
    <>
      <PageHeader title="Orders" description={`${total} order(s)`} />
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Order no., name, phone, postcode"
          aria-label="Search orders"
          className="w-full sm:w-64"
        />
        <select
          name="channel"
          defaultValue={channel ?? ""}
          aria-label="Filter by channel"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">All channels</option>
          <option value="WEBSITE">Website</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          aria-label="Filter by status"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {channel || status || q ? (
          <Button asChild variant="ghost">
            <Link href="/admin/orders">Clear</Link>
          </Button>
        ) : null}
      </form>

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="hidden md:table-cell">Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium text-brand-ink hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {o.channel === "WHATSAPP" ? "WhatsApp" : "Website"} ·{" "}
                    {formatLondonDateTime(o.createdAt)}
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {o.customerName ?? <span className="text-muted-foreground">Not given</span>}
                  {o.postcode ? (
                    <p className="text-xs text-muted-foreground">{o.postcode}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-right">
                  {formatPence(o.total)}
                  <p className="text-xs text-muted-foreground">{o._count.items} line(s)</p>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No orders found.
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
              <Link href={href(page - 1)}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={href(page + 1)}>Next</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
