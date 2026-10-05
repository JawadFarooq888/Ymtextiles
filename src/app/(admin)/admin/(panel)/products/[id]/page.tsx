import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/components/page-header";
import { ProductForm } from "@/features/admin/products/product-form";
import { ProductDeleteButton } from "@/features/admin/products/product-delete-button";
import { toProductFormValues } from "@/features/admin/products/form-values";
import { getProductForEdit, getProductFormOptions } from "@/features/admin/products/service";

export const metadata: Metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, options] = await Promise.all([getProductForEdit(id), getProductFormOptions()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        actions={<ProductDeleteButton id={product.id} name={product.name} />}
      />
      {/* Remount the form after each save so it picks up new image and variant ids. */}
      <ProductForm
        key={product.updatedAt.toISOString()}
        initial={toProductFormValues(product)}
        options={options}
      />
    </>
  );
}
