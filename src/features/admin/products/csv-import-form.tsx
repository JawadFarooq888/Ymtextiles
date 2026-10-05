"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { importProductsCsvAction } from "@/features/admin/products/csv-actions";
import type { CsvImportSummary } from "@/features/admin/products/csv-service";

export function CsvImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<CsvImportSummary | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 4_000_000) {
      toast.error("The file is larger than 4 MB. Split it into smaller files.");
      return;
    }
    startTransition(async () => {
      const text = await file.text();
      const result = await importProductsCsvAction(text);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSummary(result.data);
      if (result.data.errors.length) toast.warning("Import finished with some errors");
      else toast.success("Import complete");
    });
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border bg-card p-4 md:p-6">
        <div className="grid gap-1.5">
          <Label htmlFor="csv-file">CSV file</Label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setSummary(null);
            }}
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-brand-ink"
          />
        </div>
        <div>
          <Button type="submit" disabled={!file || pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
            {pending ? "Importing..." : "Import products"}
          </Button>
        </div>
      </form>

      {summary ? (
        <div className="grid gap-3 rounded-2xl border bg-card p-4 md:p-6" aria-live="polite">
          <h2 className="text-xl font-semibold">Result</h2>
          <ul className="text-sm">
            <li>Products created: {summary.productsCreated}</li>
            <li>Products updated: {summary.productsUpdated}</li>
            <li>Variants saved: {summary.variantsSaved}</li>
            {summary.sizesCreated.length ? (
              <li>New sizes: {summary.sizesCreated.join(", ")}</li>
            ) : null}
            {summary.coloursCreated.length ? (
              <li>
                New colours: {summary.coloursCreated.join(", ")}{" "}
                <Link href="/admin/attributes" className="underline">
                  (check their swatch colours)
                </Link>
              </li>
            ) : null}
          </ul>
          {summary.errors.length ? (
            <div>
              <p className="text-sm font-medium text-destructive">
                {summary.errors.length} problem(s). These rows were skipped:
              </p>
              <ul className="mt-1 max-h-64 list-disc overflow-y-auto pl-5 text-xs text-destructive">
                {summary.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
