"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, errorProps } from "@/features/admin/components/field";
import { saveSettingsAction } from "@/features/admin/settings/actions";
import { settingsSchema, type SettingsFormValues } from "@/features/admin/settings/schema";

type Key = keyof SettingsFormValues;

export function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const { register, handleSubmit, formState, getValues, reset, control } = useForm<
    SettingsFormValues,
    unknown,
    z.output<typeof settingsSchema>
  >({ resolver: zodResolver(settingsSchema), defaultValues: initial });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async () => {
    const values = getValues();
    const result = await saveSettingsAction(values);
    if (result.ok) {
      toast.success("Settings saved");
      reset(values);
    } else toast.error(result.error);
  });

  const toggle = (
    key: "whatsappUkOnly" | "menuShowNewIn" | "menuShowLawn" | "menuShowSale",
    label: string,
    hint: string,
  ) => (
    <div className="flex min-h-11 items-start justify-between gap-3 rounded-xl border p-3">
      <div>
        <label htmlFor={`settings-${key}`} className="text-sm font-medium text-brand-ink">
          {label}
        </label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Controller
        control={control}
        name={key}
        render={({ field }) => (
          <Switch id={`settings-${key}`} checked={field.value} onCheckedChange={field.onChange} />
        )}
      />
    </div>
  );

  const text = (key: Key, label: string, hint?: string, props?: React.ComponentProps<"input">) => {
    const id = `settings-${key}`;
    const error = errors[key]?.message;
    return (
      <Field label={label} htmlFor={id} error={error} hint={hint}>
        <Input id={id} {...props} {...register(key)} {...errorProps(id, error)} />
      </Field>
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <Section title="WhatsApp ordering">
        {text(
          "whatsappNumber",
          "WhatsApp number",
          "International format without + or spaces, e.g. 447123456789",
          { inputMode: "numeric" },
        )}
        {text("whatsappGreeting", "Greeting at the start of order messages")}
        {toggle(
          "whatsappUkOnly",
          "UK customers only",
          "On: basket WhatsApp orders need a UK postcode. Off: any country, postcode or town is free text.",
        )}
      </Section>

      <Section title="Delivery (UK)">
        {text("standardDeliveryFee", "Standard delivery fee (£)", undefined, {
          inputMode: "decimal",
        })}
        {text("expressDeliveryFee", "Express delivery fee (£)", undefined, {
          inputMode: "decimal",
        })}
        {text(
          "freeDeliveryThreshold",
          "Free standard delivery on orders over (£)",
          "Use 0 to make standard delivery always free",
          { inputMode: "decimal" },
        )}
        {text(
          "returnsDays",
          "Returns window (days)",
          "UK law requires at least 14 days for online orders",
          {
            type: "number",
            min: 0,
          },
        )}
        {text(
          "dispatchInfo",
          "Dispatch and delivery times",
          'Shown on product pages and Delivery & Returns, e.g. "Dispatched within 2 working days". Leave empty to hide.',
        )}
      </Section>

      <Section title="Shop">
        {text("storeName", "Store name")}
        {text(
          "announcementText",
          "Announcement bar text",
          "Shown at the top of every page. Leave empty to hide.",
        )}
        {text(
          "lowStockThreshold",
          "Low stock warning at",
          'Shows "Only X left" and the dashboard alert',
          {
            type: "number",
            min: 0,
          },
        )}
      </Section>

      <Section title="Header menu">
        {toggle("menuShowNewIn", "Show New In", "Products marked New, first item in the menu")}
        {toggle("menuShowLawn", "Show Lawn", "All products with fabric Lawn")}
        {toggle("menuShowSale", "Show Sale", "All products with a sale price")}
      </Section>

      <Section title="Home page and footer">
        {text("footerTagline", "Footer tagline")}
        <div className="grid gap-3 md:col-span-2">
          <p className="text-sm font-medium text-brand-ink">
            &quot;Why YM Textiles&quot; (4 points)
          </p>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[200px_1fr]">
              <Input
                aria-label={`Point ${i + 1} title`}
                placeholder="Title"
                {...register(`whyUs.${i}.title`)}
                {...errorProps(`why-${i}-title`, errors.whyUs?.[i]?.title?.message)}
              />
              <Input
                aria-label={`Point ${i + 1} text`}
                placeholder="Short sentence"
                {...register(`whyUs.${i}.text`)}
                {...errorProps(`why-${i}-text`, errors.whyUs?.[i]?.text?.message)}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Search engines (Google)">
        {text(
          "seoTitle",
          "Site title",
          "Shown in Google results and browser tabs (up to 70 characters)",
        )}
        <Field
          label="Site description"
          htmlFor="settings-seoDescription"
          error={errors.seoDescription?.message}
          hint="Shown under the title in Google results (up to 160 characters)"
        >
          <Textarea id="settings-seoDescription" rows={3} {...register("seoDescription")} />
        </Field>
      </Section>

      <Section title="Contact and social">
        {text("contactEmail", "Contact email", undefined, { type: "email" })}
        <Field
          label="Business address"
          htmlFor="settings-businessAddress"
          error={errors.businessAddress?.message}
        >
          <Textarea id="settings-businessAddress" rows={3} {...register("businessAddress")} />
        </Field>
        {text("instagramUrl", "Instagram link", undefined, {
          placeholder: "https://instagram.com/...",
        })}
        {text("tiktokUrl", "TikTok link", undefined, { placeholder: "https://tiktok.com/@..." })}
        {text("facebookUrl", "Facebook link", undefined, {
          placeholder: "https://facebook.com/...",
        })}
      </Section>

      <div className="sticky bottom-0 flex justify-end border-t bg-background/90 py-3 backdrop-blur">
        <Button type="submit" disabled={formState.isSubmitting || !formState.isDirty}>
          {formState.isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-2 md:p-6">
      <legend className="px-1 font-heading text-xl font-semibold text-brand-ink">{title}</legend>
      {children}
    </fieldset>
  );
}
