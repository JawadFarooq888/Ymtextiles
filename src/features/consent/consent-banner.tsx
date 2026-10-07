"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { useHydrated } from "@/features/basket/store";
import { useConsent } from "@/features/consent/store";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Asks once; both choices are equally easy, as the ICO requires. */
export function ConsentBanner() {
  const hydrated = useHydrated();
  const { choice, bannerOpen, decide } = useConsent();
  const show = hydrated && (choice === null || bannerOpen);
  const ref = useRef<HTMLDivElement>(null);

  // When reopened from the footer, move focus to the banner so keyboard users find it.
  useEffect(() => {
    if (bannerOpen) ref.current?.focus();
  }, [bannerOpen]);

  if (!show) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label="Cookie choices"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border bg-card p-5 shadow-xl outline-none md:bottom-6"
    >
      <p className="font-heading text-xl font-semibold text-brand-ink">Cookies</p>
      <p className="mt-1 text-sm">
        We use essential storage to run the shop (for example your basket). With your permission we
        also use analytics cookies to see which pages are useful. See our{" "}
        <Link href="/pages/cookie-policy" className="text-primary underline underline-offset-4">
          cookie policy
        </Link>
        .
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <button
          type="button"
          onClick={() => decide("rejected")}
          className="min-h-11 rounded-full border border-primary px-6 text-sm font-medium text-primary hover:bg-secondary"
        >
          Reject analytics
        </button>
        <button
          type="button"
          onClick={() => decide("accepted")}
          className="min-h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Accept analytics
        </button>
      </div>
    </div>
  );
}

/** Loads analytics only after consent. */
export function ConsentedAnalytics() {
  const hydrated = useHydrated();
  const choice = useConsent((s) => s.choice);
  if (!hydrated || choice !== "accepted") return null;
  return (
    <>
      <Analytics />
      {GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
    </>
  );
}

export function CookieSettingsButton({ className }: { className?: string }) {
  const reopen = useConsent((s) => s.reopen);
  return (
    <button type="button" onClick={reopen} className={className}>
      Cookie settings
    </button>
  );
}
