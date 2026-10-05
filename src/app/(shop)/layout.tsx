import { Toaster } from "@/components/ui/sonner";
import { BasketDrawer } from "@/features/basket/components/basket-drawer";
import { SiteFooter } from "@/features/layout/site-footer";
import { SiteHeader } from "@/features/layout/site-header";
import { FloatingWhatsApp } from "@/features/whatsapp/floating-whatsapp";
import { getSettings } from "@/lib/settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-[60vh] pb-16 md:pb-0">
        {children}
      </main>
      <SiteFooter />
      <BasketDrawer freeDeliveryThreshold={settings.freeDeliveryThreshold} />
      <FloatingWhatsApp
        number={settings.whatsappNumber}
        defaultMessage={`Hi ${settings.storeName}, I have a question.`}
      />
      <Toaster position="top-center" />
    </>
  );
}
