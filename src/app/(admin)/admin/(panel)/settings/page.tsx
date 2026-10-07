import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/components/page-header";
import { SettingsForm } from "@/features/admin/settings/settings-form";
import { getSettingsForAdmin } from "@/features/admin/settings/service";
import { requireAdmin } from "@/features/auth/guard";
import { penceToPoundsInput } from "@/lib/money";
import { parseWhyUs } from "@/features/content/why-us";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin(["ADMIN"]);
  const s = await getSettingsForAdmin();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details used across the shop and in WhatsApp messages."
      />
      <SettingsForm
        initial={{
          storeName: s?.storeName ?? "YM Textiles",
          whatsappNumber: s?.whatsappNumber ?? "",
          whatsappGreeting: s?.whatsappGreeting ?? "Hi YM Textiles, I would like to order:",
          freeDeliveryThreshold: penceToPoundsInput(s?.freeDeliveryThreshold ?? 0),
          standardDeliveryFee: penceToPoundsInput(s?.standardDeliveryFee ?? 0),
          expressDeliveryFee: penceToPoundsInput(s?.expressDeliveryFee ?? 0),
          announcementText: s?.announcementText ?? "",
          contactEmail: s?.contactEmail ?? "",
          instagramUrl: s?.instagramUrl ?? "",
          tiktokUrl: s?.tiktokUrl ?? "",
          facebookUrl: s?.facebookUrl ?? "",
          businessAddress: s?.businessAddress ?? "",
          returnsDays: String(s?.returnsDays ?? 14),
          lowStockThreshold: String(s?.lowStockThreshold ?? 3),
          whatsappUkOnly: s?.whatsappUkOnly ?? true,
          dispatchInfo: s?.dispatchInfo ?? "",
          footerTagline: s?.footerTagline ?? "",
          seoTitle: s?.seoTitle ?? "",
          seoDescription: s?.seoDescription ?? "",
          menuShowNewIn: s?.menuShowNewIn ?? true,
          menuShowBestSellers: s?.menuShowBestSellers ?? true,
          menuShowSale: s?.menuShowSale ?? true,
          whyUs: parseWhyUs(s?.whyUs),
        }}
      />
    </>
  );
}
