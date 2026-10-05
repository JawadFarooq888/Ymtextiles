import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { requireAdmin } from "@/features/auth/guard";
import { logoutAction } from "@/features/auth/actions";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { MobileNav } from "@/features/admin/components/mobile-nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | YM Textiles Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-card p-4 lg:block">
        <Link href="/admin" className="mb-6 block px-3 font-heading text-2xl tracking-wide">
          YM TEXTILES
        </Link>
        <AdminNav isAdmin={isAdmin} />
      </aside>
      <div className="min-w-0">
        <header className="flex h-14 items-center gap-2 border-b bg-card px-4">
          <MobileNav isAdmin={isAdmin} />
          <span className="font-heading text-xl tracking-wide lg:hidden">YM TEXTILES</span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" target="_blank">
                <ExternalLinkIcon /> <span className="hidden sm:inline">View shop</span>
              </Link>
            </Button>
            <Link
              href="/admin/account"
              className="hidden text-sm text-muted-foreground hover:text-primary hover:underline md:inline"
            >
              {user.email}
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOutIcon /> Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
