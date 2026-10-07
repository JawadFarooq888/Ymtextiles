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
import type { SizeChartData } from "@/features/size-charts/chart";
import { cn } from "@/lib/utils";

/** Round centimetres to the nearest 0.5. */
function toCm(inches: number) {
  return Math.round(inches * 2.54 * 2) / 2;
}

export function SizeChartTable({
  chart,
  notes,
  name = "Size chart",
}: {
  chart: SizeChartData;
  notes?: string | null;
  name?: string;
}) {
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
              "min-h-11 rounded-full px-4 text-sm",
              unit === u ? "bg-primary text-primary-foreground" : "text-brand-body",
            )}
          >
            {u === "in" ? "Inches" : "Centimetres"}
          </button>
        ))}
      </div>
      <div
        className="overflow-x-auto rounded-xl border focus-visible:outline-2 focus-visible:outline-primary"
        tabIndex={0}
        role="region"
        aria-label={`${name} measurements, scroll sideways for more`}
      >
        <table className="w-full min-w-[420px] text-sm">
          <caption className="sr-only">
            Measurements in {unit === "in" ? "inches" : "centimetres"}
          </caption>
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="p-3 text-left font-medium">
                Size
              </th>
              {chart.columns.map((c) => (
                <th key={c} scope="col" className="p-3 text-left font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((r) => (
              <tr key={r.size} className="border-t">
                <th scope="row" className="p-3 text-left font-medium text-brand-ink">
                  {r.size}
                </th>
                {chart.columns.map((c, i) => {
                  const value = r.values[i];
                  return (
                    <td key={c} className="p-3">
                      {value == null ? "–" : unit === "in" ? value : toCm(value)}
                    </td>
                  );
                })}
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
  chart,
  notes,
}: {
  name: string;
  chart: SizeChartData;
  notes?: string | null;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-primary underline underline-offset-4"
        >
          <RulerIcon className="size-4" aria-hidden /> Size chart
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{name}</DialogTitle>
          <DialogDescription>
            Measurements of the jeans, laid flat. Compare with a pair that fits you well.
          </DialogDescription>
        </DialogHeader>
        <SizeChartTable chart={chart} notes={notes} name={name} />
      </DialogContent>
    </Dialog>
  );
}
