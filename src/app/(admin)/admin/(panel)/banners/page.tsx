import type { Metadata } from "next";
import Image from "next/image";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/components/page-header";
import { BannerDeleteButton, BannerFormDialog } from "@/features/admin/banners/banner-form-dialog";
import { listBanners } from "@/features/admin/banners/service";
import { cloudinaryUrl } from "@/lib/image";

export const metadata: Metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await listBanners();
  return (
    <>
      <PageHeader
        title="Banners"
        description="Home page hero slides and the announcement bar."
        actions={
          <BannerFormDialog
            trigger={
              <Button>
                <PlusIcon /> New banner
              </Button>
            }
          />
        }
      />
      <ul className="divide-y rounded-2xl border bg-card">
        {banners.map((b) => (
          <li key={b.id} className="flex items-center gap-3 p-4">
            <div className="relative hidden h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
              {b.image ? (
                <Image
                  src={cloudinaryUrl(b.image, 200)}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-brand-ink">{b.title}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline">{b.placement === "HERO" ? "Hero" : "Announcement"}</Badge>
                <Badge variant={b.isActive ? "secondary" : "outline"}>
                  {b.isActive ? "Active" : "Hidden"}
                </Badge>
              </div>
            </div>
            <BannerFormDialog
              initial={{
                id: b.id,
                title: b.title,
                subtitle: b.subtitle ?? "",
                image: b.image ?? "",
                ctaText: b.ctaText ?? "",
                ctaUrl: b.ctaUrl ?? "",
                placement: b.placement,
                isActive: b.isActive,
                sortOrder: String(b.sortOrder),
              }}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${b.title}`}>
                  <PencilIcon />
                </Button>
              }
            />
            <BannerDeleteButton id={b.id} title={b.title} />
          </li>
        ))}
        {banners.length === 0 ? (
          <li className="p-8 text-center text-sm text-muted-foreground">No banners yet.</li>
        ) : null}
      </ul>
    </>
  );
}
