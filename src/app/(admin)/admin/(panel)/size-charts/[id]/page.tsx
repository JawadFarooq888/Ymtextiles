import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/components/page-header";
import { SizeChartForm } from "@/features/admin/size-charts/size-chart-form";
import { sizeChartRowSchema } from "@/features/admin/size-charts/schema";
import { getSizeChart } from "@/features/admin/size-charts/service";

export const metadata: Metadata = { title: "Edit size chart" };
export const dynamic = "force-dynamic";

export default async function EditSizeChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chart = await getSizeChart(id);
  if (!chart) notFound();

  const rows = sizeChartRowSchema.array().safeParse(chart.rows);
  return (
    <>
      <PageHeader title={`Edit ${chart.name}`} />
      <SizeChartForm
        initial={{
          id: chart.id,
          name: chart.name,
          notes: chart.notes ?? "",
          rows: (rows.success ? rows.data : []).map((r) => ({
            size: r.size,
            chest: String(r.chest),
            length: String(r.length),
            sleeve: String(r.sleeve),
            trouserLength: String(r.trouserLength),
          })),
        }}
      />
    </>
  );
}
