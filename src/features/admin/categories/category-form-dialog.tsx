"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, errorProps } from "@/features/admin/components/field";
import { ImageUploadField } from "@/features/admin/components/image-upload-field";
import { saveCategoryAction } from "@/features/admin/categories/actions";
import {
  categorySchema,
  type CategoryData,
  type CategoryFormValues,
} from "@/features/admin/categories/schema";
import { slugify } from "@/lib/slug";

interface CategoryFormDialogProps {
  trigger: React.ReactNode;
  initial?: CategoryFormValues;
  parentOptions: { id: string; label: string }[];
}

const EMPTY: CategoryFormValues = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  image: "",
  sortOrder: "0",
  isActive: true,
};

export function CategoryFormDialog({ trigger, initial, parentOptions }: CategoryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CategoryFormValues, unknown, CategoryData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initial ?? EMPTY,
  });
  const { register, handleSubmit, formState, setValue, getValues, control, reset } = form;
  const errors = formState.errors;
  const isEdit = !!initial?.id;

  const onSubmit = handleSubmit(async () => {
    // Send the raw form values; the server validates them with the same schema.
    const result = await saveCategoryAction(getValues());
    if (result.ok) {
      toast.success(isEdit ? "Category updated" : "Category created");
      setOpen(false);
      if (!isEdit) reset(EMPTY);
    } else {
      toast.error(result.error);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(initial ?? EMPTY);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field label="Name" htmlFor="cat-name" error={errors.name?.message}>
            <Input
              id="cat-name"
              {...register("name", {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!isEdit && !formState.dirtyFields.slug) {
                    setValue("slug", slugify(e.target.value));
                  }
                },
              })}
              {...errorProps("cat-name", errors.name?.message)}
            />
          </Field>
          <Field
            label="URL slug"
            htmlFor="cat-slug"
            error={errors.slug?.message}
            hint="Used in the link: /collections/your-slug"
          >
            <Input
              id="cat-slug"
              {...register("slug")}
              {...errorProps("cat-slug", errors.slug?.message)}
            />
          </Field>
          <Field
            label="Parent category"
            htmlFor="cat-parent"
            hint="Leave empty for a top-level category"
          >
            <select
              id="cat-parent"
              {...register("parentId")}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">None (top level)</option>
              {parentOptions
                .filter((p) => p.id !== initial?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Description" htmlFor="cat-description" error={errors.description?.message}>
            <Textarea id="cat-description" rows={3} {...register("description")} />
          </Field>
          <Field label="Image" htmlFor="cat-image" error={errors.image?.message}>
            <Controller
              control={control}
              name="image"
              render={({ field }) => (
                <ImageUploadField
                  id="cat-image"
                  folder="categories"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Sort order"
              htmlFor="cat-sort"
              error={errors.sortOrder?.message}
              hint="Lower numbers come first"
            >
              <Input id="cat-sort" type="number" min={0} {...register("sortOrder")} />
            </Field>
            <Field label="Visible in shop" htmlFor="cat-active">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="cat-active" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
