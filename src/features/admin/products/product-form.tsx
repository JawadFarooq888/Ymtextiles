"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, errorProps } from "@/features/admin/components/field";
import { saveProductAction } from "@/features/admin/products/actions";
import { ProductImagesField } from "@/features/admin/products/product-images-field";
import { VariantMatrixField } from "@/features/admin/products/variant-matrix-field";
import {
  productSchema,
  type ProductData,
  type ProductFormValues,
} from "@/features/admin/products/schema";
import { slugify } from "@/lib/slug";

export interface ProductFormOptions {
  categories: { id: string; label: string }[];
  sizes: { id: string; label: string }[];
  colours: { id: string; name: string; hex: string }[];
  sizeCharts: { id: string; name: string }[];
  fabrics: string[];
}

const selectClass = "border-input bg-background h-9 w-full rounded-lg border px-3 text-sm";

export function ProductForm({
  initial,
  options,
}: {
  initial: ProductFormValues;
  options: ProductFormOptions;
}) {
  const router = useRouter();
  const isEdit = !!initial.id;
  const form = useForm<ProductFormValues, unknown, ProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: initial,
  });
  const { register, control, handleSubmit, formState, getValues, setValue, watch } = form;
  const errors = formState.errors;
  const name = watch("name");

  const onSubmit = handleSubmit(
    async () => {
      const result = await saveProductAction(getValues());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Product saved" : "Product created");
      if (isEdit) router.refresh();
      else router.replace(`/admin/products/${result.data.id}`);
    },
    (invalid: FieldErrors<ProductFormValues>) => {
      const first = Object.keys(invalid)[0];
      toast.error(`Please fix the highlighted fields${first ? ` (${first})` : ""}.`);
    },
  );

  const err = (key: keyof ProductFormValues) => {
    const e = errors[key];
    return e && "message" in e && typeof e.message === "string" ? e.message : undefined;
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <Section title="Basics">
        <Field label="Product name" htmlFor="p-name" error={err("name")} className="md:col-span-2">
          <Input
            id="p-name"
            {...register("name", {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!isEdit && !formState.dirtyFields.slug)
                  setValue("slug", slugify(e.target.value));
              },
            })}
            {...errorProps("p-name", err("name"))}
          />
        </Field>
        <Field label="URL slug" htmlFor="p-slug" error={err("slug")} hint="/products/your-slug">
          <Input id="p-slug" {...register("slug")} {...errorProps("p-slug", err("slug"))} />
        </Field>
        <Field label="Product SKU" htmlFor="p-sku" error={err("sku")} hint="e.g. YM-LWN-001">
          <Input
            id="p-sku"
            className="uppercase"
            {...register("sku")}
            {...errorProps("p-sku", err("sku"))}
          />
        </Field>
        <Field label="Category" htmlFor="p-category" error={err("categoryId")}>
          <select id="p-category" className={selectClass} {...register("categoryId")}>
            <option value="">Choose a category</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" htmlFor="p-type">
          <select id="p-type" className={selectClass} {...register("type")}>
            <option value="STITCHED">Stitched (ready to wear)</option>
            <option value="UNSTITCHED">Unstitched</option>
          </select>
        </Field>
        <Field
          label="Fabric"
          htmlFor="p-fabric"
          error={err("fabric")}
          hint="e.g. Lawn, Chiffon, Khaddar"
        >
          <Input id="p-fabric" list="fabric-options" {...register("fabric")} />
          <datalist id="fabric-options">
            {options.fabrics.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Field>
        <Field label="Pieces" htmlFor="p-pieces">
          <select id="p-pieces" className={selectClass} {...register("pieces")}>
            <option value="">Not specified</option>
            <option value="1">1 piece</option>
            <option value="2">2 piece</option>
            <option value="3">3 piece</option>
          </select>
        </Field>
        <Field
          label="Description"
          htmlFor="p-description"
          error={err("description")}
          className="md:col-span-2"
        >
          <Textarea id="p-description" rows={6} {...register("description")} />
        </Field>
        <Field
          label="Fabric and care details"
          htmlFor="p-care"
          error={err("careDetails")}
          className="md:col-span-2"
        >
          <Textarea id="p-care" rows={3} {...register("careDetails")} />
        </Field>
        <Field
          label="Tags"
          htmlFor="p-tags"
          error={err("tags")}
          hint="Comma separated, used for search, e.g. embroidered, summer, eid"
          className="md:col-span-2"
        >
          <Input id="p-tags" {...register("tags")} />
        </Field>
      </Section>

      <Section title="Price">
        <Field label="Regular price (£)" htmlFor="p-base" error={err("basePrice")}>
          <Input
            id="p-base"
            inputMode="decimal"
            {...register("basePrice")}
            {...errorProps("p-base", err("basePrice"))}
          />
        </Field>
        <Field
          label="Sale price (£)"
          htmlFor="p-sale"
          error={err("salePrice")}
          hint="Leave empty when not on sale"
        >
          <Input
            id="p-sale"
            inputMode="decimal"
            {...register("salePrice")}
            {...errorProps("p-sale", err("salePrice"))}
          />
        </Field>
      </Section>

      <Section title="Photos" single>
        <ProductImagesField
          control={control}
          register={register}
          colours={options.colours}
          productName={name}
        />
      </Section>

      <Section title="Sizes, colours and stock" single>
        <VariantMatrixField
          control={control}
          register={register}
          getValues={getValues}
          setValue={setValue}
          errors={errors}
          sizes={options.sizes}
          colours={options.colours}
        />
      </Section>

      <Section title="Visibility">
        <Toggle control={control} name="isActive" label="Visible in shop" />
        <Toggle control={control} name="isNew" label="Show in New In" />
        <Toggle control={control} name="isBestSeller" label="Show in Best Sellers" />
        <Toggle control={control} name="isFeatured" label="Featured on home page" />
        <Field label="Size chart" htmlFor="p-sizechart">
          <select id="p-sizechart" className={selectClass} {...register("sizeChartId")}>
            <option value="">No size chart</option>
            {options.sizeCharts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Search engines (optional)">
        <Field
          label="SEO title"
          htmlFor="p-seo-title"
          error={err("seoTitle")}
          hint="Up to 70 characters"
        >
          <Input id="p-seo-title" {...register("seoTitle")} />
        </Field>
        <Field
          label="SEO description"
          htmlFor="p-seo-desc"
          error={err("seoDescription")}
          hint="Up to 160 characters"
        >
          <Textarea id="p-seo-desc" rows={2} {...register("seoDescription")} />
        </Field>
      </Section>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t bg-background/90 py-3 backdrop-blur">
        {isEdit ? (
          <Button asChild variant="ghost">
            <Link href={`/products/${initial.slug}`} target="_blank">
              <ExternalLinkIcon /> View in shop
            </Link>
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Back to products
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  single,
  children,
}: {
  title: string;
  single?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      className={`grid gap-4 rounded-2xl border bg-card p-4 md:p-6 ${single ? "" : "md:grid-cols-2"}`}
    >
      <legend className="px-1 font-heading text-xl font-semibold text-brand-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function Toggle({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useForm<ProductFormValues, unknown, ProductData>>["control"];
  name: "isActive" | "isNew" | "isBestSeller" | "isFeatured";
  label: string;
}) {
  const id = `p-${name}`;
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch id={id} checked={field.value} onCheckedChange={field.onChange} />
        )}
      />
    </div>
  );
}
