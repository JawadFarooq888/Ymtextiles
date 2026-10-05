import type { Metadata } from "next";
import { BasketView } from "@/features/basket/components/basket-view";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Your basket",
  robots: { index: false, follow: false },
};

export default async function BasketPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-4xl font-semibold">Your basket</h1>
      <BasketView
        whatsappUkOnly={settings.whatsappUkOnly}
        delivery={{
          standardDeliveryFee: settings.standardDeliveryFee,
          expressDeliveryFee: settings.expressDeliveryFee,
          freeDeliveryThreshold: settings.freeDeliveryThreshold,
        }}
      />
    </div>
  );
}
