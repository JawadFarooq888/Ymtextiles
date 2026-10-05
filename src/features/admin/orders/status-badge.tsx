import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/features/orders/status";
import { cn } from "@/lib/utils";

const TONES: Record<OrderStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  AWAITING_WHATSAPP_CONFIRMATION: "bg-amber-100 text-amber-900",
  PAID: "bg-emerald-100 text-emerald-900",
  PROCESSING: "bg-sky-100 text-sky-900",
  SHIPPED: "bg-indigo-100 text-indigo-900",
  DELIVERED: "bg-primary/10 text-primary",
  CANCELLED: "bg-muted text-muted-foreground line-through",
  REFUNDED: "bg-brand-sale/10 text-brand-sale",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
