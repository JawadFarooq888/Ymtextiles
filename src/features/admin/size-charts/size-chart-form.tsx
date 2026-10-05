"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, errorProps } from "@/features/admin/components/field";
import { saveSizeChartAction } from "@/features/admin/size-charts/actions";
import { sizeChartSchema, type SizeChartFormValues } from "@/features/admin/size-charts/schema";

const COLUMNS = [
  { key: "chest", label: "Chest" },
  { key: "length", label: "Length" },
  { key: "sleeve", label: "Sleeve" },
  { key: "trouserLength", label: "Shalwar / trouser" },
] as const;

export function SizeChartForm({ initial }: { initial: SizeChartFormValues }) {
  const router = useRouter();
  const { register, control, handleSubmit, formState, getValues } = useForm<
    SizeChartFormValues,
    unknown,
    z.output<typeof sizeChartSchema>
  >({ resolver: zodResolver(sizeChartSchema), defaultValues: initial });
  const rows = useFieldArray({ control, name: "rows" });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async () => {
    const result = await saveSizeChartAction(getValues());
    if (result.ok) {
      toast.success("Size chart saved");
      router.push("/admin/size-charts");
    } else toast.error(result.error);
  });

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 rounded-2xl border bg-card p-4 md:p-6"
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" htmlFor="sc-name" error={errors.name?.message}>
          <Input
            id="sc-name"
            {...register("name")}
            {...errorProps("sc-name", errors.name?.message)}
          />
        </Field>
        <Field
          label="Notes (shown under the chart)"
          htmlFor="sc-notes"
          error={errors.notes?.message}
        >
          <Textarea id="sc-notes" rows={2} {...register("notes")} />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-ink">Measurements in inches</p>
        <p className="mb-3 text-xs text-muted-foreground">
          The shop shows both inches and centimetres automatically.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="p-1 font-medium">Size</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className="p-1 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="p-1">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.fields.map((row, i) => (
                <tr key={row.id}>
                  <td className="p-1">
                    <Input aria-label={`Row ${i + 1} size`} {...register(`rows.${i}.size`)} />
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="p-1">
                      <Input
                        type="number"
                        step="0.25"
                        min={0}
                        aria-label={`Row ${i + 1} ${c.label}`}
                        {...register(`rows.${i}.${c.key}`)}
                      />
                    </td>
                  ))}
                  <td className="p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove row ${i + 1}`}
                      onClick={() => rows.remove(i)}
                    >
                      <Trash2Icon />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {errors.rows?.message || errors.rows?.root?.message ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {errors.rows?.message ?? errors.rows?.root?.message}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() =>
            rows.append({ size: "", chest: "", length: "", sleeve: "", trouserLength: "" })
          }
        >
          <PlusIcon /> Add row
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/size-charts")}>
          Cancel
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving..." : "Save size chart"}
        </Button>
      </div>
    </form>
  );
}
