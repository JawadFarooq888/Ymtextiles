import Image from "next/image";
import Link from "next/link";
import { MessageCircleIcon, PlaneIcon, RulerIcon, ShieldCheckIcon, StoreIcon } from "lucide-react";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { getActiveBanners, getCatalogIndex, getCategoryTree } from "@/features/catalog/queries";
import { sortProducts } from "@/features/catalog/filters";
import { HeroCarousel } from "@/features/layout/hero-carousel";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";
import { buildWhatsAppUrl } from "@/features/whatsapp/url";
import { cloudinaryUrl } from "@/lib/image";
import { getSettings } from "@/lib/settings";
import { JsonLd, organizationJsonLd } from "@/lib/seo";
import { parseWhyUs } from "@/features/content/why-us";

const WHY_ICONS = [PlaneIcon, StoreIcon, RulerIcon, MessageCircleIcon];

export default async function HomePage() {
  const [banners, index, tree, settings] = await Promise.all([
    getActiveBanners(),
    getCatalogIndex(),
    getCategoryTree(),
    getSettings(),
  ]);

  const hero = banners.filter((b) => b.placement === "HERO");
  const newIn = sortProducts(
    index.products.filter((p) => p.isNew),
    "newest",
  ).slice(0, 8);
  const bestSellers = index.products.filter((p) => p.isBestSeller).slice(0, 8);

  return (
    <>
      {hero.length ? (
        <HeroCarousel slides={hero} />
      ) : (
        <section className="bg-primary px-4 py-24 text-center text-primary-foreground">
          <h1 className="font-heading text-5xl text-brand-ivory">YM TEXTILES</h1>
          <p className="mt-3">Pakistani clothing, stocked in the UK.</p>
        </section>
      )}

      <JsonLd data={organizationJsonLd(settings)} />
      <h1 className="sr-only">YM Textiles: Pakistani clothing in the UK</h1>

      {tree.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-16" aria-labelledby="shop-by-category">
          <SectionHeading id="shop-by-category" title="Shop by category" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-6">
            {tree.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
                    {c.image ? (
                      <Image
                        src={cloudinaryUrl(c.image, 600)}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#f8f1e3,#f2eadb_60%,#e8dcc4)]">
                        <span className="font-heading text-5xl text-brand-gold">
                          {c.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-center font-heading text-xl text-brand-ink group-hover:text-primary">
                    {c.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {newIn.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-16" aria-labelledby="new-arrivals">
          <SectionHeading id="new-arrivals" title="New arrivals" href="/collections/new-in" />
          <ProductGrid products={newIn} priorityCount={hero.length ? 0 : 4} />
        </section>
      ) : null}

      {bestSellers.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-16" aria-labelledby="best-sellers">
          <SectionHeading id="best-sellers" title="Best sellers" href="/collections/best-sellers" />
          <ProductGrid products={bestSellers} />
        </section>
      ) : null}

      <section className="mt-20 bg-secondary" aria-labelledby="why-ym">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <SectionHeading id="why-ym" title="Why YM Textiles" centered />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {parseWhyUs(settings.whyUs).map(({ title, text }, i) => {
              const Icon = WHY_ICONS[i] ?? MessageCircleIcon;
              return (
                <li key={title} className="text-center">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-background text-primary">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                  <p className="mt-1 text-sm">{text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16">
        <div className="grid items-center gap-6 rounded-3xl bg-primary px-6 py-10 text-primary-foreground md:grid-cols-[1fr_auto] md:px-12">
          <div>
            <h2 className="text-3xl font-semibold text-brand-ivory md:text-4xl">
              Not sure about size or fabric?
            </h2>
            <p className="mt-2 text-brand-ivory/85">
              Message us on WhatsApp. We can send extra photos, measurements and delivery times.
            </p>
          </div>
          <a
            href={buildWhatsAppUrl(settings.whatsappNumber, "Hi YM Textiles, I have a question.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-ivory px-8 text-sm font-medium text-primary hover:bg-white"
          >
            <MessageCircleIcon className="size-4" aria-hidden /> Chat on WhatsApp
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-16 text-center" aria-labelledby="newsletter">
        <ShieldCheckIcon className="mx-auto size-6 text-brand-gold" aria-hidden />
        <h2 id="newsletter" className="mt-2 text-3xl font-semibold">
          First to know about new arrivals
        </h2>
        <p className="mt-2 mb-6 text-sm">
          Occasional emails about new collections and offers. No spam.
        </p>
        <div className="mx-auto max-w-md text-left">
          <NewsletterForm source="home" />
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  id,
  title,
  href,
  centered,
}: {
  id: string;
  title: string;
  href?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={`mb-6 flex items-end gap-4 ${centered ? "justify-center text-center" : "justify-between"}`}
    >
      <h2 id={id} className="text-3xl font-semibold md:text-4xl">
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View all
        </Link>
      ) : null}
    </div>
  );
}
