import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/features/admin/components/page-header";
import { getDashboardData } from "@/features/admin/dashboard/service";
import { formatLondonDateTime } from "@/lib/dates";
import { formatPence } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const stats = [
    { label: "Orders today", value: String(data.todayOrders) },
    { label: "WhatsApp orders to confirm", value: String(data.pendingWhatsAppCount) },
    {
      label: "Revenue this week",
      value: formatPence(data.weekRevenue),
      hint: `${data.weekPaidOrders} paid order(s) since Monday`,
    },
    { label: "Active products", value: String(data.productCount) },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="font-sans text-sm font-normal text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-brand-ink">{s.value}</p>
              {s.hint ? <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pending WhatsApp orders</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pendingWhatsApp.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing waiting for confirmation.</p>
            ) : (
              <ul className="divide-y">
                {data.pendingWhatsApp.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-brand-ink hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {o.customerName ?? "Customer"} · {formatLondonDateTime(o.createdAt)}
                      </p>
                    </div>
                    <span>{formatPence(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Low stock (≤ {data.threshold})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All variants are well stocked.</p>
            ) : (
              <ul className="divide-y">
                {data.lowStock.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${v.product.id}`}
                        className="block truncate font-medium text-brand-ink hover:underline"
                      >
                        {v.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {v.size.label} · {v.colour.name} · {v.sku}
                      </p>
                    </div>
                    <Badge variant={v.stock === 0 ? "destructive" : "secondary"}>
                      {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
