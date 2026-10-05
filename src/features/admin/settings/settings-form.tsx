"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, errorProps } from "@/features/admin/components/field";
import { saveSettingsAction } from "@/features/admin/settings/actions";
import { settingsSchema, type SettingsFormValues } from "@/features/admin/settings/schema";

type Key = keyof SettingsFormValues;

export function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const { register, handleSubmit, formState, getValues, reset } = useForm<
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
