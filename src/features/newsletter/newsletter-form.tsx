"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeAction } from "@/features/newsletter/actions";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  source,
  tone = "light",
}: {
  source: string;
  tone?: "light" | "dark";
}) {
  const [state, formAction, pending] = useActionState(subscribeAction, undefined);
  const id = useId();

  if (state?.ok) {
    return (
      <p
        role="status"
        className={cn("text-sm", tone === "dark" ? "text-brand-ivory" : "text-brand-ink")}
      >
        Thank you! You&apos;re on the list.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="source" value={source} />
      <div className="flex gap-2">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="Your email address"
          className="h-11 rounded-full bg-white px-4 text-brand-ink"
        />
        <Button
          type="submit"
          disabled={pending}
          className={cn(
            "h-11 shrink-0 rounded-full px-6",
            tone === "dark" && "bg-brand-ivory text-primary hover:bg-white",
          )}
        >
          {pending ? "..." : "Sign up"}
        </Button>
      </div>
      <label
        className={cn(
          "flex items-start gap-2 text-xs",
          tone === "dark" ? "text-brand-ivory/85" : "text-muted-foreground",
        )}
      >
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 size-5 shrink-0 accent-brand-gold"
        />
        <span>
          I&apos;d like to receive emails about new arrivals and offers. Unsubscribe at any time.
          See our{" "}
          <Link href="/pages/privacy-policy" className="underline">
            privacy policy
          </Link>
          .
        </span>
      </label>
      {state?.error ? (
        <p
          role="alert"
          className={cn("text-xs", tone === "dark" ? "text-red-200" : "text-destructive")}
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
