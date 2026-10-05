"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
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
import { Field, errorProps } from "@/features/admin/components/field";
import { ImageUploadField } from "@/features/admin/components/image-upload-field";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { deleteBannerAction, saveBannerAction } from "@/features/admin/banners/actions";
import { bannerSchema, type BannerFormValues } from "@/features/admin/banners/schema";

const EMPTY: BannerFormValues = {
  title: "",
  subtitle: "",
  image: "",
  ctaText: "",
  ctaUrl: "",
  placement: "HERO",
  isActive: true,
  sortOrder: "0",
};

export function BannerFormDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: BannerFormValues;
}) {
  const [open, setOpen] = useState(false);
  const { register, control, handleSubmit, formState, getValues, reset, watch } = useForm<
    BannerFormValues,
    unknown,
    z.output<typeof bannerSchema>
  >({ resolver: zodResolver(bannerSchema), defaultValues: initial ?? EMPTY });
  const errors = formState.errors;
  const placement = watch("placement");

  const onSubmit = handleSubmit(async () => {
    const result = await saveBannerAction(getValues());
    if (result.ok) {
      toast.success("Banner saved");
      setOpen(false);
    } else toast.error(result.error);
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
          <DialogTitle>{initial?.id ? "Edit banner" : "New banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field label="Placement" htmlFor="banner-placement">
            <select
              id="banner-placement"
              {...register("placement")}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="HERO">Home page hero (carousel slide)</option>
              <option value="ANNOUNCEMENT">Announcement bar (top of every page)</option>
            </select>
          </Field>
          <Field
            label={placement === "ANNOUNCEMENT" ? "Announcement text" : "Title"}
            htmlFor="banner-title"
            error={errors.title?.message}
          >
            <Input
              id="banner-title"
              {...register("title")}
              {...errorProps("banner-title", errors.title?.message)}
            />
          </Field>
          {placement === "HERO" ? (
            <>
              <Field label="Subtitle" htmlFor="banner-subtitle" error={errors.subtitle?.message}>
                <Input id="banner-subtitle" {...register("subtitle")} />
              </Field>
              <Field
                label="Image"
                htmlFor="banner-image"
                error={errors.image?.message}
                hint="Wide landscape photo, at least 1600px wide"
              >
                <Controller
                  control={control}
                  name="image"
                  render={({ field }) => (
                    <ImageUploadField
                      id="banner-image"
                      folder="banners"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Button text" htmlFor="banner-cta" error={errors.ctaText?.message}>
                  <Input id="banner-cta" placeholder="Shop now" {...register("ctaText")} />
                </Field>
                <Field label="Button link" htmlFor="banner-url" error={errors.ctaUrl?.message}>
                  <Input
                    id="banner-url"
                    placeholder="/collections/new-in"
                    {...register("ctaUrl")}
                    {...errorProps("banner-url", errors.ctaUrl?.message)}
                  />
                </Field>
              </div>
            </>
          ) : (
            <Field label="Link (optional)" htmlFor="banner-url" error={errors.ctaUrl?.message}>
              <Input id="banner-url" placeholder="/collections/sale" {...register("ctaUrl")} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort order" htmlFor="banner-sort" error={errors.sortOrder?.message}>
              <Input id="banner-sort" type="number" min={0} {...register("sortOrder")} />
            </Field>
            <Field label="Active" htmlFor="banner-active">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    id="banner-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>
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

export function BannerDeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <ConfirmDeleteButton itemLabel={`banner "${title}"`} onConfirm={() => deleteBannerAction(id)} />
  );
}
