"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileTextIcon,
  FolderTreeIcon,
  MailIcon,
  UsersIcon,
  ImageIcon,
  LayoutDashboardIcon,
  PaletteIcon,
  ReceiptIcon,
  RulerIcon,
  SettingsIcon,
  ShirtIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ReceiptIcon },
  { href: "/admin/products", label: "Products", icon: ShirtIcon },
  { href: "/admin/categories", label: "Categories", icon: FolderTreeIcon },
  { href: "/admin/attributes", label: "Sizes & colours", icon: PaletteIcon },
  { href: "/admin/size-charts", label: "Size charts", icon: RulerIcon },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/pages", label: "Pages", icon: FileTextIcon },
  { href: "/admin/newsletter", label: "Newsletter", icon: MailIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon, adminOnly: true },
  { href: "/admin/users", label: "Users", icon: UsersIcon, adminOnly: true },
];

export function AdminNav({
  onNavigate,
  isAdmin = true,
}: {
  onNavigate?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="grid gap-1">
      {LINKS.filter((l) => isAdmin || !("adminOnly" in l && l.adminOnly)).map(
        ({ href, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-brand-body hover:bg-secondary hover:text-brand-ink",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        },
      )}
    </nav>
  );
}
