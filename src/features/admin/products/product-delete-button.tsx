"use client";

import { useRouter } from "next/navigation";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { deleteProductAction } from "@/features/admin/products/actions";

export function ProductDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return (
    <ConfirmDeleteButton
      size="sm"
      itemLabel={name}
      description="This removes the product, its variants and photos. Past orders keep their details. To hide it temporarily, switch off 'Visible in shop' instead."
      onConfirm={() => deleteProductAction(id)}
      onDeleted={() => router.push("/admin/products")}
    />
  );
}
