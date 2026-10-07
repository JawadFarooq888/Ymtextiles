"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, errorProps } from "@/features/admin/components/field";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import {
  deleteColourAction,
  deleteSizeAction,
  saveColourAction,
  saveSizeAction,
} from "@/features/admin/attributes/actions";
import {
  colourSchema,
  jeansSizeLabel,
  jeansSizeSortOrder,
  sizeSchema,
  type ColourFormValues,
  type SizeFormValues,
} from "@/features/admin/attributes/schema";
import type { z } from "zod";

export function SizeDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: SizeFormValues;
}) {
  const [open, setOpen] = useState(false);
  const empty: SizeFormValues = { label: "", waist: "", length: "", sortOrder: "0" };
  const { register, handleSubmit, formState, getValues, reset, setValue } = useForm<
    SizeFormValues,
    unknown,
    z.output<typeof sizeSchema>
  >({ resolver: zodResolver(sizeSchema), defaultValues: initial ?? empty });
  const errors = formState.errors;

  // Suggest "W32 L30" and a sort order that keeps sizes in waist, then length, order.
  function fillJeansLabel() {
    const waist = Number(getValues("waist"));
    const length = Number(getValues("length"));
    if (Number.isInteger(waist) && Number.isInteger(length) && waist > 0 && length > 0) {
      setValue("label", jeansSizeLabel(waist, length), { shouldDirty: true });
      setValue("sortOrder", String(jeansSizeSortOrder(waist, length)), { shouldDirty: true });
    }
  }

  const onSubmit = handleSubmit(async () => {
    const result = await saveSizeAction(getValues());
    if (result.ok) {
      toast.success("Size saved");
      setOpen(false);
    } else toast.error(result.error);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(initial ?? empty);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit size" : "New size"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Waist (inches)" htmlFor="size-waist" error={errors.waist?.message}>
              <Input
                id="size-waist"
                inputMode="numeric"
                placeholder="32"
                {...register("waist", { onChange: fillJeansLabel })}
                {...errorProps("size-waist", errors.waist?.message)}
              />
            </Field>
            <Field label="Length (inches)" htmlFor="size-length" error={errors.length?.message}>
              <Input
                id="size-length"
                inputMode="numeric"
                placeholder="30"
                {...register("length", { onChange: fillJeansLabel })}
                {...errorProps("size-length", errors.length?.message)}
              />
            </Field>
          </div>
          <Field
            label="Label"
            htmlFor="size-label"
            error={errors.label?.message}
            hint="Filled in from waist and length (e.g. W32 L30). For kids use an age like 7-8Y and leave waist/length empty."
          >
            <Input
              id="size-label"
              {...register("label")}
              {...errorProps("size-label", errors.label?.message)}
            />
          </Field>
          <Field
            label="Sort order"
            htmlFor="size-sort"
            error={errors.sortOrder?.message}
            hint="Lower numbers come first"
          >
            <Input id="size-sort" type="number" min={0} {...register("sortOrder")} />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={formState.isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ColourDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: ColourFormValues;
}) {
  const [open, setOpen] = useState(false);
  const empty: ColourFormValues = { name: "", hex: "#1F4D3F" };
  const { register, handleSubmit, formState, getValues, reset, watch, setValue } = useForm<
    ColourFormValues,
    unknown,
    z.output<typeof colourSchema>
  >({ resolver: zodResolver(colourSchema), defaultValues: initial ?? empty });
  const errors = formState.errors;
  const hex = watch("hex");

  const onSubmit = handleSubmit(async () => {
    const result = await saveColourAction(getValues());
    if (result.ok) {
      toast.success("Colour saved");
      setOpen(false);
    } else toast.error(result.error);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(initial ?? empty);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit colour" : "New colour"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field label="Name" htmlFor="colour-name" error={errors.name?.message}>
            <Input
              id="colour-name"
              {...register("name")}
              {...errorProps("colour-name", errors.name?.message)}
            />
          </Field>
          <Field label="Swatch colour" htmlFor="colour-hex" error={errors.hex?.message}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick colour"
                value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000"}
                onChange={(e) =>
                  setValue("hex", e.target.value.toUpperCase(), { shouldDirty: true })
                }
                className="h-9 w-12 cursor-pointer rounded border"
              />
              <Input
                id="colour-hex"
                {...register("hex")}
                {...errorProps("colour-hex", errors.hex?.message)}
              />
            </div>
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={formState.isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteSizeButton({ id, label }: { id: string; label: string }) {
  return <ConfirmDeleteButton itemLabel={`size ${label}`} onConfirm={() => deleteSizeAction(id)} />;
}

export function DeleteColourButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDeleteButton itemLabel={`colour ${name}`} onConfirm={() => deleteColourAction(id)} />
  );
}
