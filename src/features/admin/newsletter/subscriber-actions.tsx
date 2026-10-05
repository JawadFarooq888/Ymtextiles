"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { deleteSubscriberAction, setUnsubscribedAction } from "@/features/admin/newsletter/actions";

export function SubscriberActions({
  id,
  email,
  unsubscribed,
}: {
  id: string;
  email: string;
  unsubscribed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setUnsubscribedAction({ id, unsubscribed: !unsubscribed });
            if (result.ok) toast.success(unsubscribed ? "Resubscribed" : "Unsubscribed");
            else toast.error(result.error);
          })
        }
      >
        {unsubscribed ? "Resubscribe" : "Unsubscribe"}
      </Button>
      <ConfirmDeleteButton
        itemLabel={email}
        description="Removes their email completely (use this for data deletion requests)."
        onConfirm={() => deleteSubscriberAction(id)}
      />
    </div>
  );
}
