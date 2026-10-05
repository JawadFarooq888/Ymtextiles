"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
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
import type { ActionResult } from "@/features/admin/action-result";

interface ConfirmDeleteButtonProps {
  itemLabel: string;
  onConfirm: () => Promise<ActionResult<unknown>>;
  onDeleted?: () => void;
  description?: string;
  size?: "sm" | "icon-sm";
}

export function ConfirmDeleteButton({
  itemLabel,
  onConfirm,
  onDeleted,
  description,
  size = "icon-sm",
}: ConfirmDeleteButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size={size}
          aria-label={`Delete ${itemLabel}`}
          disabled={pending}
        >
          <Trash2Icon />
          {size === "sm" ? "Delete" : null}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription>{description ?? "This cannot be undone."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const result = await onConfirm();
                if (result.ok) {
                  toast.success(`${itemLabel} deleted`);
                  onDeleted?.();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
