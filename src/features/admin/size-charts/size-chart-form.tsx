"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, errorProps } from "@/features/admin/components/field";
import { saveSizeChartAction } from "@/features/admin/size-charts/actions";
import { sizeChartSchema, type SizeChartFormValues } from "@/features/admin/size-charts/schema";

export function SizeChartForm({ initial }: { initial: SizeChartFormValues }) {
  const router = useRouter();
  const { register, control, handleSubmit, formState, getValues, setValue, watch } = useForm<
    SizeChartFormValues,
    unknown,
    z.output<typeof sizeChartSchema>
  >({ resolver: zodResolver(sizeChartSchema), defaultValues: initial });
  const columns = useFieldArray({ control, name: "columns", keyName: "fieldKey" });
  const rows = useFieldArray({ control, name: "rows", keyName: "fieldKey" });
  const errors = formState.errors;
  const columnNames = watch("columns");

  // Adding or removing a column changes every row, so rows always have one value per column.
  function addColumn() {
    columns.append({ name: "" });
    getValues("rows").forEach((r, i) => setValue(`rows.${i}.values`, [...r.values, ""]));
  }
  function removeColumn(index: number) {
    columns.remove(index);
    getValues("rows").forEach((r, i) =>
      setValue(
        `rows.${i}.values`,
        r.values.filter((_, j) => j !== index),
      ),
    );
  }

  const onSubmit = handleSubmit(async () => {
    const result = await saveSizeChartAction(getValues());
    if (result.ok) {
      toast.success("Size chart saved");
      router.push("/admin/size-charts");
    } else toast.error(result.error);
  });

  const tableError =
    errors.rows?.message ??
    errors.rows?.root?.message ??
    errors.columns?.message ??
    errors.columns?.root?.message;

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 rounded-2xl border bg-card p-4 md:p-6"
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" htmlFor="sc-name" error={errors.name?.message} hint="e.g. Men's jeans">
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
        <p className="mb-1 text-sm font-medium text-brand-ink">Measurements in inches</p>
        <p className="mb-3 text-xs text-muted-foreground">
          The shop shows inches and centimetres automatically. Leave a box empty if it does not
          apply.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="p-1 font-medium">Size</th>
                {columns.fields.map((col, j) => (
                  <th key={col.fieldKey} className="p-1 font-medium">
                    <div className="flex items-center gap-1">
                      <Input
                        aria-label={`Column ${j + 1} name`}
                        placeholder="Column name"
                        className="h-8 text-xs"
                        {...register(`columns.${j}.name`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove column ${columnNames?.[j]?.name || j + 1}`}
                        onClick={() => removeColumn(j)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  </th>
                ))}
                <th className="p-1">
                  <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                    <PlusIcon /> Column
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.fields.map((row, i) => (
                <tr key={row.fieldKey}>
                  <td className="p-1">
                    <Input
                      aria-label={`Row ${i + 1} size`}
                      placeholder="W32"
                      {...register(`rows.${i}.size`)}
                    />
                  </td>
                  {columns.fields.map((col, j) => (
                    <td key={col.fieldKey} className="p-1">
                      <Input
                        inputMode="decimal"
                        aria-label={`Row ${i + 1} ${columnNames?.[j]?.name || `column ${j + 1}`}`}
                        {...register(`rows.${i}.values.${j}`)}
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
        {tableError ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {tableError}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => rows.append({ size: "", values: columns.fields.map(() => "") })}
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
