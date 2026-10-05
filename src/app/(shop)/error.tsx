"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs tracking-[0.3em] text-brand-gold-dark uppercase">
        Something went wrong
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Sorry, this page didn&apos;t load</h1>
      <p className="mt-4">
        Please try again. If it keeps happening, contact us and we&apos;ll help.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
        <Link
          href="/pages/contact"
          className="inline-flex min-h-12 items-center rounded-full border border-primary px-8 text-sm font-medium text-primary"
        >
          Contact us on WhatsApp
        </Link>
      </div>
    </div>
  );
}
