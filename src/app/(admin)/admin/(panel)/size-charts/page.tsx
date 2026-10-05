import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/components/page-header";
import { SizeChartDeleteButton } from "@/features/admin/size-charts/size-chart-delete-button";
import { listSizeCharts } from "@/features/admin/size-charts/service";

export const metadata: Metadata = { title: "Size charts" };
export const dynamic = "force-dynamic";

export default async function SizeChartsPage() {
  const charts = await listSizeCharts();
  return (
    <>
      <PageHeader
        title="Size charts"
        description="Link a chart to products to show a size guide on the product page."
        actions={
          <Button asChild>
            <Link href="/admin/size-charts/new">
              <PlusIcon /> New size chart
            </Link>
          </Button>
        }
      />
      <ul className="divide-y rounded-2xl border bg-card">
        {charts.map((c) => (
          <li key={c.id} className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-medium text-brand-ink">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {Array.isArray(c.rows) ? c.rows.length : 0} row(s) · used by {c._count.products}{" "}
                product(s)
              </p>
            </div>
            <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`}>
              <Link href={`/admin/size-charts/${c.id}`}>
                <PencilIcon />
              </Link>
            </Button>
            <SizeChartDeleteButton id={c.id} name={c.name} />
          </li>
        ))}
        {charts.length === 0 ? (
          <li className="p-8 text-center text-sm text-muted-foreground">No size charts yet.</li>
        ) : null}
      </ul>
    </>
  );
}
