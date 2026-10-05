import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { BasketButton } from "@/features/basket/components/basket-button";
import { buildMenu } from "@/features/catalog/collections";
import { getActiveBanners, getCategoryTree } from "@/features/catalog/queries";
import { MegaMenu } from "@/features/layout/mega-menu";
import { MobileMenu } from "@/features/layout/mobile-menu";
import { helpPageLinks } from "@/features/layout/links";
import { getPageLinks } from "@/features/content/queries";
import { getSettings } from "@/lib/settings";

async function AnnouncementBar() {
  const [banners, settings] = await Promise.all([getActiveBanners(), getSettings()]);
  const banner = banners.find((b) => b.placement === "ANNOUNCEMENT");
  const text = banner?.title ?? settings.announcementText;
  if (!text) return null;
  const content = <span className="line-clamp-1">{text}</span>;
  return (
    <aside
      aria-label="Announcement"
      className="bg-primary px-4 py-2 text-center text-xs tracking-wide text-primary-foreground"
    >
      {banner?.ctaUrl ? (
        <Link href={banner.ctaUrl} className="underline-offset-4 hover:underline">
          {content}
        </Link>
      ) : (
        content
      )}
    </aside>
  );
}

export async function SiteHeader() {
  const [tree, settings, pages] = await Promise.all([
    getCategoryTree(),
    getSettings(),
    getPageLinks(),
  ]);
  const menu = buildMenu(tree, {
    showNewIn: settings.menuShowNewIn,
    showLawn: settings.menuShowLawn,
    showSale: settings.menuShowSale,
  });
  const helpLinks = helpPageLinks(pages);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center">
              <MobileMenu items={menu} helpLinks={helpLinks} />
            </div>
            <Link
              href="/"
              className="font-heading text-2xl font-semibold tracking-[0.2em] text-brand-ink sm:text-3xl"
            >
              YM TEXTILES
            </Link>
            <div className="flex items-center justify-end gap-1">
              <Link
                href="/search"
                aria-label="Search"
                className="flex size-11 items-center justify-center rounded-full text-brand-ink hover:bg-secondary"
              >
                <SearchIcon className="size-5" />
              </Link>
              <BasketButton />
            </div>
          </div>
          <MegaMenu items={menu} />
        </div>
      </header>
    </>
  );
}
