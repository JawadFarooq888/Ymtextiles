"use client";

import { useState, useTransition } from "react";
import type { OrderChannel, OrderStatus } from "@prisma/client";
import { CheckIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelOrderAction,
  confirmOrderAction,
  saveAdminNotesAction,
  setOrderStatusAction,
} from "@/features/admin/orders/actions";
import { STATUS_LABELS, TRANSITIONS } from "@/features/orders/status";
import { buildWhatsAppUrl } from "@/features/whatsapp/url";
import type { ActionResult } from "@/features/admin/action-result";

export function OrderActions({
  id,
  orderNumber,
  channel,
  status,
  phone,
  customerName,
}: {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  status: OrderStatus;
  phone: string | null;
  customerName: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult>, success: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(success);
      else toast.error(result.error);
    });

  const awaiting = status === "AWAITING_WHATSAPP_CONFIRMATION";
  const next = TRANSITIONS[status].filter(
    (s) => !(awaiting && (s === "PROCESSING" || s === "CANCELLED")) && s !== "CANCELLED",
  );
  const canCancel = TRANSITIONS[status].includes("CANCELLED");
  const greeting = `Hi${customerName ? ` ${customerName.split(" ")[0]}` : ""}, this is YM Textiles about your order ${orderNumber}.`;

  return (
    <div className="flex flex-wrap gap-2">
      {awaiting ? (
        <Button
          disabled={pending}
          onClick={() => run(() => confirmOrderAction(id), "Order confirmed and stock reduced")}
        >
          <CheckIcon /> Confirm
        </Button>
      ) : null}
      {phone ? (
        <Button asChild variant="outline" className="border-[#1f7a4d] text-[#14593a]">
          <a href={buildWhatsAppUrl(phone, greeting)} target="_blank" rel="noopener noreferrer">
            <MessageCircleIcon /> Message customer
          </a>
        </Button>
      ) : null}
      {next.map((s) => (
        <Button
          key={s}
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(
              () => setOrderStatusAction({ id, status: s }),
              `Marked as ${STATUS_LABELS[s].toLowerCase()}`,
            )
          }
        >
          Mark {STATUS_LABELS[s].toLowerCase()}
        </Button>
      ))}
      {canCancel ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={pending}>
              <XIcon /> Cancel order
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel {orderNumber}?</AlertDialogTitle>
              <AlertDialogDescription>
                {channel === "WEBSITE" && status !== "PENDING"
                  ? "Any reduced stock is put back. A card payment is not refunded automatically: refund it in Stripe."
                  : "Any reduced stock is put back."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep order</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => run(() => cancelOrderAction(id), "Order cancelled")}
              >
                Cancel order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}

export function AdminNotesForm({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveAdminNotesAction({ id, adminNotes: value });
          if (result.ok) toast.success("Notes saved");
          else toast.error(result.error);
        });
      }}
    >
      <label htmlFor="admin-notes" className="text-sm font-medium text-brand-ink">
        Internal notes (not shown to the customer)
      </label>
      <Textarea
        id="admin-notes"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="justify-self-start"
        disabled={pending || value === initial}
      >
        Save notes
      </Button>
    </form>
  );
}
