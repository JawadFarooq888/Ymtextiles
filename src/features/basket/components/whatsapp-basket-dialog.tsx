"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, MessageCircleIcon } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, errorProps } from "@/features/admin/components/field";
import { useBasket } from "@/features/basket/store";
import { createWhatsAppBasketOrder } from "@/features/whatsapp/actions";
import { openWhatsAppAfter } from "@/features/whatsapp/open-whatsapp";
import {
  whatsappCustomerSchema,
  type WhatsAppCustomerFormValues,
} from "@/features/whatsapp/schema";

export function WhatsAppBasketDialog({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const lines = useBasket((s) => s.lines);
  const clear = useBasket((s) => s.clear);
  const { register, handleSubmit, formState, getValues } = useForm<
    WhatsAppCustomerFormValues,
    unknown,
    z.output<typeof whatsappCustomerSchema>
  >({
    resolver: zodResolver(whatsappCustomerSchema),
    defaultValues: { name: "", phone: "", postcode: "", note: "" },
  });
  const errors = formState.errors;

  // handleSubmit validates first; the WhatsApp tab is then opened inside the same click.
  const onSubmit = handleSubmit(() => {
    const values = getValues();
    startTransition(async () => {
      const result = await openWhatsAppAfter(() =>
        createWhatsAppBasketOrder({
          ...values,
          lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        }),
      );
      if (result.ok) {
        clear();
        setOpen(false);
        toast.success(
          `Order ${result.data.orderNumber} created. Send the message in WhatsApp to confirm.`,
        );
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#1f7a4d] bg-white px-6 text-sm font-medium tracking-wide text-[#14593a] uppercase hover:bg-[#effaf3] disabled:opacity-50"
        >
          <MessageCircleIcon className="size-4" aria-hidden /> Order whole basket on WhatsApp
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Order on WhatsApp</DialogTitle>
          <DialogDescription>
            We&apos;ll open WhatsApp with your order ready to send. We reply to confirm
            availability, delivery and payment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field label="Your name" htmlFor="wa-name" error={errors.name?.message}>
            <Input
              id="wa-name"
              autoComplete="name"
              className="h-11"
              {...register("name")}
              {...errorProps("wa-name", errors.name?.message)}
            />
          </Field>
          <Field label="Mobile number" htmlFor="wa-phone" error={errors.phone?.message}>
            <Input
              id="wa-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="07123 456789"
              className="h-11"
              {...register("phone")}
              {...errorProps("wa-phone", errors.phone?.message)}
            />
          </Field>
          <Field label="Postcode" htmlFor="wa-postcode" error={errors.postcode?.message}>
            <Input
              id="wa-postcode"
              autoComplete="postal-code"
              className="h-11 uppercase"
              {...register("postcode")}
              {...errorProps("wa-postcode", errors.postcode?.message)}
            />
          </Field>
          <Field label="Note (optional)" htmlFor="wa-note" error={errors.note?.message}>
            <Textarea id="wa-note" rows={2} {...register("note")} />
          </Field>
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1f9d55] px-6 text-sm font-medium tracking-wide text-white uppercase hover:bg-[#178347] disabled:opacity-60"
          >
            {pending ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              <MessageCircleIcon className="size-4" aria-hidden />
            )}
            Continue to WhatsApp
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
