import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/components/page-header";
import { CsvImportForm } from "@/features/admin/products/csv-import-form";
import { CSV_COLUMNS } from "@/features/admin/products/csv-format";

export const metadata: Metadata = { title: "Import products" };

export default function ImportProductsPage() {
  return (
    <>
      <PageHeader
        title="Import products from CSV"
        description="Add or update many products at once. Nothing is deleted by an import."
      />
      <div className="grid gap-6">
        <section className="rounded-2xl bg-secondary p-4 text-sm md:p-6">
          <h2 className="mb-2 text-xl font-semibold">How it works</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              The easiest start: click <strong>Export CSV</strong> on the Products page, edit that
              file in Excel or Google Sheets, then import it here.
            </li>
            <li>
              One row per <strong>size + colour</strong>. Rows with the same{" "}
              <code>product_sku</code> belong to the same product. Product details are read from its
              first row.
            </li>
            <li>
              Existing products (matched by <code>product_sku</code>) are updated. Blank cells leave
              the current value unchanged.
            </li>
            <li>
              New products need <code>name</code>, <code>category_slug</code> and{" "}
              <code>base_price</code>. Prices are in pounds, e.g. <code>45.00</code>.
            </li>
            <li>
              <code>type</code> is Stitched or Unstitched. Yes/no columns accept yes or no.
            </li>
            <li>
              <code>image_urls</code>: Cloudinary links separated by <code>|</code>. They are only
              added to products that have no photos yet.
            </li>
            <li>New sizes and colours are created automatically.</li>
          </ol>
          <p className="mt-3 text-xs">
            Columns: <code className="break-all">{CSV_COLUMNS.join(", ")}</code>
          </p>
        </section>
        <CsvImportForm />
      </div>
    </>
  );
}
