import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/components/page-header";
import { SizeChartForm } from "@/features/admin/size-charts/size-chart-form";
import { DEFAULT_JEANS_COLUMNS } from "@/features/size-charts/chart";

export const metadata: Metadata = { title: "New size chart" };

export default function NewSizeChartPage() {
  return (
    <>
      <PageHeader title="New size chart" />
      <SizeChartForm
        initial={{
          name: "",
          notes: "",
          columns: DEFAULT_JEANS_COLUMNS.map((name) => ({ name })),
          rows: [28, 30, 32, 34, 36].map((w) => ({
            size: `W${w}`,
            values: DEFAULT_JEANS_COLUMNS.map(() => ""),
          })),
        }}
      />
    </>
  );
}
