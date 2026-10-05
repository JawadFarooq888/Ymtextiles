"use client";

import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { deleteCategoryAction } from "@/features/admin/categories/actions";

export function CategoryDeleteButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDeleteButton
      itemLabel={name}
      description="Categories that still contain products or sub-categories cannot be deleted."
      onConfirm={() => deleteCategoryAction(id)}
    />
  );
}
