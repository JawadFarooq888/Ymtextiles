"use client";

import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { deleteSizeChartAction } from "@/features/admin/size-charts/actions";

export function SizeChartDeleteButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDeleteButton
      itemLabel={name}
      description="Products using this chart will simply show no size chart."
      onConfirm={() => deleteSizeChartAction(id)}
    />
  );
}
