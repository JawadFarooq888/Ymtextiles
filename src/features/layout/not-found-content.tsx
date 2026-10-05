import Link from "next/link";
import { buildWhatsAppUrl } from "@/features/whatsapp/url";
import { getSettings } from "@/lib/settings";

export async function NotFoundContent() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs tracking-[0.3em] text-brand-gold-dark uppercase">Page not found</p>
      <h1 className="mt-3 text-4xl font-semibold md:text-5xl">We couldn&apos;t find that page</h1>
      <p className="mt-4">It may have moved, or the product may no longer be available.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground"
        >
          Back to the shop
        </Link>
        <a
          href={buildWhatsAppUrl(
            settings.whatsappNumber,
            "Hi YM Textiles, I couldn't find a page on your website.",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center rounded-full border border-primary px-8 text-sm font-medium text-primary"
        >
          Ask us on WhatsApp
        </a>
      </div>
    </div>
  );
}
