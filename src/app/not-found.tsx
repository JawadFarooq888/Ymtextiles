import { NotFoundContent } from "@/features/layout/not-found-content";
import { SiteFooter } from "@/features/layout/site-footer";
import { SiteHeader } from "@/features/layout/site-header";

// For URLs that match no route at all (shop pages use (shop)/not-found.tsx inside the shop layout).
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
