import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";
import { HELP_LINKS, LEGAL_LINKS } from "@/features/layout/links";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";
import { buildWhatsAppUrl } from "@/features/whatsapp/url";
import { getSettings } from "@/lib/settings";

const SHOP_LINKS = [
  { label: "New In", href: "/collections/new-in" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Lawn", href: "/collections/lawn" },
  { label: "Sale", href: "/collections/sale" },
  { label: "All products", href: "/collections/all" },
];

export async function SiteFooter() {
  const settings = await getSettings();
  const social = [
    { label: "Instagram", href: settings.instagramUrl },
    { label: "TikTok", href: settings.tiktokUrl },
    { label: "Facebook", href: settings.facebookUrl },
  ].filter((s): s is { label: string; href: string } => !!s.href);

  return (
    <footer className="mt-20 bg-primary text-brand-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-heading text-3xl tracking-[0.2em]">YM TEXTILES</p>
          <p className="mt-2 max-w-md text-sm text-brand-ivory/80">
            Pakistani clothing, sourced in Pakistan and stocked in the UK.
          </p>
          <div className="mt-6 max-w-md">
            <p className="mb-3 font-heading text-xl">Join our newsletter</p>
            <NewsletterForm source="footer" tone="dark" />
          </div>
        </div>
        <FooterColumn title="Shop" links={SHOP_LINKS} />
        <div>
          <FooterColumn title="Help" links={HELP_LINKS} />
          <a
            href={buildWhatsAppUrl(settings.whatsappNumber, "Hi YM Textiles, I need some help.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-ivory px-4 text-sm font-medium text-primary"
          >
            <MessageCircleIcon className="size-4" aria-hidden /> Help on WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-brand-ivory/15">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-brand-ivory/75">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. All prices in GBP and include VAT.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
            {social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium tracking-[0.2em] text-brand-sand uppercase">{title}</p>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex min-h-10 items-center text-sm text-brand-ivory/85 hover:text-brand-ivory"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
