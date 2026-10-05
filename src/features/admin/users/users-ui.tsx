"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRoundIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, errorProps } from "@/features/admin/components/field";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import {
  changeOwnPasswordAction,
  changeRoleAction,
  createStaffAction,
  removeStaffAction,
  resetPasswordAction,
} from "@/features/admin/users/actions";
import {
  changeOwnPasswordSchema,
  createUserSchema,
  type ChangeOwnPasswordValues,
  type CreateUserValues,
} from "@/features/admin/users/schema";

const selectClass = "h-9 rounded-lg border border-input bg-background px-3 text-sm";

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const empty: CreateUserValues = { name: "", email: "", role: "STAFF", password: "" };
  const { register, handleSubmit, formState, getValues, reset } = useForm<
    CreateUserValues,
    unknown,
    z.output<typeof createUserSchema>
  >({ resolver: zodResolver(createUserSchema), defaultValues: empty });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async () => {
    const result = await createStaffAction(getValues());
    if (result.ok) {
      toast.success("Login created. Share the password with them privately.");
      setOpen(false);
      reset(empty);
    } else toast.error(result.error);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> Add person
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add admin or staff</DialogTitle>
          <DialogDescription>
            Staff can manage products and orders. Admins can also change settings and logins.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field label="Name" htmlFor="u-name" error={errors.name?.message}>
            <Input
              id="u-name"
              {...register("name")}
              {...errorProps("u-name", errors.name?.message)}
            />
          </Field>
          <Field label="Email" htmlFor="u-email" error={errors.email?.message}>
            <Input
              id="u-email"
              type="email"
              {...register("email")}
              {...errorProps("u-email", errors.email?.message)}
            />
          </Field>
          <Field label="Role" htmlFor="u-role">
            <select id="u-role" className={selectClass} {...register("role")}>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <Field
            label="Password"
            htmlFor="u-password"
            error={errors.password?.message}
            hint="At least 10 characters with letters and a number"
          >
            <Input
              id="u-password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
              {...errorProps("u-password", errors.password?.message)}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={formState.isSubmitting}>
              Create login
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserRowActions({
  id,
  email,
  role,
  isSelf,
}: {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF";
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        aria-label={`Role for ${email}`}
        className={selectClass}
        defaultValue={role}
        disabled={isSelf || pending}
        onChange={(e) =>
          startTransition(async () => {
            const result = await changeRoleAction({ id, role: e.target.value });
            if (result.ok) toast.success("Role updated");
            else {
              toast.error(result.error);
              e.target.value = role;
            }
          })
        }
      >
        <option value="STAFF">Staff</option>
        <option value="ADMIN">Admin</option>
      </select>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <KeyRoundIcon /> Reset password
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New password for {email}</DialogTitle>
            <DialogDescription>
              Share it with them privately. They can change it under My account.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await resetPasswordAction({ id, password });
                if (result.ok) {
                  toast.success("Password changed");
                  setOpen(false);
                  setPassword("");
                } else toast.error(result.error);
              });
            }}
          >
            <label htmlFor={`pw-${id}`} className="text-sm font-medium">
              New password
            </label>
            <Input
              id={`pw-${id}`}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={pending}>
              Save password
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {!isSelf ? (
        <ConfirmDeleteButton
          itemLabel={email}
          description="They will no longer be able to sign in. Orders are not affected."
          onConfirm={() => removeStaffAction(id)}
        />
      ) : null}
    </div>
  );
}

export function ChangeOwnPasswordForm() {
  const empty: ChangeOwnPasswordValues = { current: "", password: "", confirm: "" };
  const { register, handleSubmit, formState, getValues, reset } = useForm<
    ChangeOwnPasswordValues,
    unknown,
    z.output<typeof changeOwnPasswordSchema>
  >({ resolver: zodResolver(changeOwnPasswordSchema), defaultValues: empty });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async () => {
    const result = await changeOwnPasswordAction(getValues());
    if (result.ok) {
      toast.success("Your password has been changed");
      reset(empty);
    } else toast.error(result.error);
  });

  return (
    <form
      onSubmit={onSubmit}
      className="grid max-w-md gap-4 rounded-2xl border bg-card p-6"
      noValidate
    >
      <Field label="Current password" htmlFor="pw-current" error={errors.current?.message}>
        <Input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          {...register("current")}
          {...errorProps("pw-current", errors.current?.message)}
        />
      </Field>
      <Field
        label="New password"
        htmlFor="pw-new"
        error={errors.password?.message}
        hint="At least 10 characters with letters and a number"
      >
        <Input
          id="pw-new"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          {...errorProps("pw-new", errors.password?.message)}
        />
      </Field>
      <Field label="Repeat new password" htmlFor="pw-confirm" error={errors.confirm?.message}>
        <Input
          id="pw-confirm"
          type="password"
          autoComplete="new-password"
          {...register("confirm")}
          {...errorProps("pw-confirm", errors.confirm?.message)}
        />
      </Field>
      <Button type="submit" disabled={formState.isSubmitting} className="justify-self-start">
        Change password
      </Button>
    </form>
  );
}
