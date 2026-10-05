"use client";

import { useState } from "react";
import { RulerIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface SizeChartRow {
  size: string;
  chest: number;
  length: number;
  sleeve: number;
  trouserLength: number;
}

const COLUMNS = [
  { key: "chest", label: "Chest" },
  { key: "length", label: "Length" },
  { key: "sleeve", label: "Sleeve" },
  { key: "trouserLength", label: "Shalwar / trouser" },
] as const;

/** Round centimetres to the nearest 0.5. */
function toCm(inches: number) {
  return Math.round(inches * 2.54 * 2) / 2;
}

export function SizeChartTable({ rows, notes }: { rows: SizeChartRow[]; notes?: string | null }) {
  const [unit, setUnit] = useState<"in" | "cm">("in");
  return (
    <div className="grid gap-3">
      <div
        role="radiogroup"
        aria-label="Units"
        className="inline-flex justify-self-start rounded-full border p-1"
      >
        {(["in", "cm"] as const).map((u) => (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={unit === u}
            onClick={() => setUnit(u)}
            className={cn(
              "min-h-9 rounded-full px-4 text-sm",
              unit === u ? "bg-primary text-primary-foreground" : "text-brand-body",
            )}
          >
            {u === "in" ? "Inches" : "Centimetres"}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[420px] text-sm">
          <caption className="sr-only">
            Measurements in {unit === "in" ? "inches" : "centimetres"}
          </caption>
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="p-3 text-left font-medium">
                Size
              </th>
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="p-3 text-left font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-t">
                <th scope="row" className="p-3 text-left font-medium text-brand-ink">
                  {r.size}
                </th>
                {COLUMNS.map((c) => (
                  <td key={c.key} className="p-3">
                    {unit === "in" ? r[c.key] : toCm(r[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notes ? <p className="text-xs text-muted-foreground">{notes}</p> : null}
    </div>
  );
}

export function SizeChartDialog({
  name,
  rows,
  notes,
}: {
  name: string;
  rows: SizeChartRow[];
  notes?: string | null;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1 text-sm text-primary underline underline-offset-4"
        >
          <RulerIcon className="size-4" aria-hidden /> Size chart
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{name}</DialogTitle>
          <DialogDescription>Garment measurements for each size.</DialogDescription>
        </DialogHeader>
        <SizeChartTable rows={rows} notes={notes} />
      </DialogContent>
    </Dialog>
  );
}
