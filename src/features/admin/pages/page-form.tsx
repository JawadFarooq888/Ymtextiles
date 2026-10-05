"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, errorProps } from "@/features/admin/components/field";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { deletePageAction, savePageAction } from "@/features/admin/pages/actions";
import { pageSchema, type PageFormValues } from "@/features/admin/pages/schema";
import { SimpleText } from "@/lib/simple-text";
import { slugify } from "@/lib/slug";

const HELP = [
  ["## Heading", "a section heading"],
  ["- item", "a bullet point (one per line)"],
  ["**bold**", "bold text"],
  ["[link text](https://...)", "a link (also /pages/... or mailto:)"],
  ["empty line", "starts a new paragraph"],
];

export function PageForm({ initial, isSystem }: { initial: PageFormValues; isSystem: boolean }) {
  const router = useRouter();
  const isEdit = !!initial.id;
  const { register, control, handleSubmit, formState, getValues, setValue, watch } = useForm<
    PageFormValues,
    unknown,
    z.output<typeof pageSchema>
  >({ resolver: zodResolver(pageSchema), defaultValues: initial });
  const errors = formState.errors;
  const body = watch("body");
  const slug = watch("slug");

  const onSubmit = handleSubmit(async () => {
    const result = await savePageAction(getValues());
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Page saved");
    if (!isEdit) router.replace(`/admin/pages/${result.data.id}`);
    else router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <div className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-2 md:p-6">
        <Field label="Title" htmlFor="page-title" error={errors.title?.message}>
          <Input
            id="page-title"
            {...register("title", {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!isEdit && !formState.dirtyFields.slug)
                  setValue("slug", slugify(e.target.value));
              },
            })}
            {...errorProps("page-title", errors.title?.message)}
          />
        </Field>
        <Field
          label="Address"
          htmlFor="page-slug"
          error={errors.slug?.message}
          hint={
            isSystem ? "Built-in page: the address cannot change" : `/pages/${slug || "your-page"}`
          }
        >
          <Input
            id="page-slug"
            readOnly={isSystem}
            {...register("slug")}
            {...errorProps("page-slug", errors.slug?.message)}
          />
        </Field>
        <Field
          label="Search engine description"
          htmlFor="page-meta"
          error={errors.metaDescription?.message}
          hint="Shown in Google results (up to 160 characters)"
          className="md:col-span-2"
        >
          <Input id="page-meta" {...register("metaDescription")} />
        </Field>
        <Field
          label="Order in footer"
          htmlFor="page-sort"
          error={errors.sortOrder?.message}
          hint="Lower numbers come first"
        >
          <Input id="page-sort" type="number" min={0} {...register("sortOrder")} />
        </Field>
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3">
          <label htmlFor="page-published" className="text-sm">
            Published (visible in the shop and footer)
          </label>
          <Controller
            control={control}
            name="isPublished"
            render={({ field }) => (
              <Switch id="page-published" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-2">
          <Field label="Page text" htmlFor="page-body" error={errors.body?.message}>
            <Textarea
              id="page-body"
              rows={22}
              className="font-mono text-sm"
              {...register("body")}
            />
          </Field>
          <details className="rounded-xl bg-secondary p-3 text-xs">
            <summary className="cursor-pointer font-medium text-brand-ink">Formatting help</summary>
            <ul className="mt-2 grid gap-1">
              {HELP.map(([code, meaning]) => (
                <li key={code}>
                  <code className="rounded bg-background px-1">{code}</code> = {meaning}
                </li>
              ))}
            </ul>
          </details>
        </div>
        <section aria-label="Preview" className="rounded-2xl border bg-background p-4 md:p-6">
          <p className="mb-3 text-xs tracking-[0.2em] text-muted-foreground uppercase">Preview</p>
          <div className="prose-ym">
            <SimpleText text={body ?? ""} />
          </div>
          {isSystem && ["delivery-returns", "contact", "size-guide"].includes(slug) ? (
            <p className="mt-4 rounded-lg bg-secondary p-2 text-xs">
              The shop also shows live details from Settings / Size charts on this page (fees,
              contact details or size tables), so you don&apos;t need to type them here.
            </p>
          ) : null}
        </section>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t bg-background/90 py-3 backdrop-blur">
        {isEdit ? (
          <Button asChild variant="ghost">
            <Link href={`/pages/${initial.slug}`} target="_blank">
              <ExternalLinkIcon /> View page
            </Link>
          </Button>
        ) : null}
        {isEdit && !isSystem ? (
          <ConfirmDeleteButton
            size="sm"
            itemLabel={initial.title}
            onConfirm={() => deletePageAction(initial.id)}
            onDeleted={() => router.push("/admin/pages")}
          />
        ) : null}
        <Button type="button" variant="outline" onClick={() => router.push("/admin/pages")}>
          Back to pages
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving..." : "Save page"}
        </Button>
      </div>
    </form>
  );
}
