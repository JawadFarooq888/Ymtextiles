import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/components/page-header";
import { ProductForm } from "@/features/admin/products/product-form";
import { EMPTY_PRODUCT } from "@/features/admin/products/form-values";
import { getProductFormOptions } from "@/features/admin/products/service";

export const metadata: Metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const options = await getProductFormOptions();
  return (
    <>
      <PageHeader title="New product" />
      <ProductForm initial={EMPTY_PRODUCT} options={options} />
    </>
  );
}
