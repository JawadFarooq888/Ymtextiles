import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/components/page-header";
import { SizeChartForm } from "@/features/admin/size-charts/size-chart-form";

export const metadata: Metadata = { title: "New size chart" };

export default function NewSizeChartPage() {
  return (
    <>
      <PageHeader title="New size chart" />
      <SizeChartForm
        initial={{
          name: "",
          notes: "",
          rows: ["XS", "S", "M", "L", "XL", "XXL"].map((size) => ({
            size,
            chest: "",
            length: "",
            sleeve: "",
            trouserLength: "",
          })),
        }}
      />
    </>
  );
}
