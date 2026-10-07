import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/components/page-header";
import { SizeChartForm } from "@/features/admin/size-charts/size-chart-form";
import { getSizeChart } from "@/features/admin/size-charts/service";
import { DEFAULT_JEANS_COLUMNS, parseSizeChart } from "@/features/size-charts/chart";

export const metadata: Metadata = { title: "Edit size chart" };
export const dynamic = "force-dynamic";

export default async function EditSizeChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chart = await getSizeChart(id);
  if (!chart) notFound();

  // Charts saved in the old clothing format start again with the jeans columns.
  const data = parseSizeChart(chart.columns, chart.rows) ?? {
    columns: DEFAULT_JEANS_COLUMNS,
    rows: [{ size: "", values: DEFAULT_JEANS_COLUMNS.map(() => null) }],
  };
  return (
    <>
      <PageHeader title={`Edit ${chart.name}`} />
      <SizeChartForm
        initial={{
          id: chart.id,
          name: chart.name,
          notes: chart.notes ?? "",
          columns: data.columns.map((name) => ({ name })),
          rows: data.rows.map((r) => ({
            size: r.size,
            values: data.columns.map((_, i) => (r.values[i] == null ? "" : String(r.values[i]))),
          })),
        }}
      />
    </>
  );
}
