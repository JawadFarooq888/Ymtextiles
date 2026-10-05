"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import type { MenuItem } from "@/features/catalog/collections";
import { cloudinaryUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

/** Desktop navigation. Items with sub-categories open a panel on hover, focus or click. */
export function MegaMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const show = (label: string) => {
    clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  return (
    <nav ref={navRef} aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center justify-center gap-1">
        {items.map((item) => {
          const hasPanel = item.children.length > 0;
          const isOpen = open === item.label;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li
              key={item.href}
              onMouseEnter={hasPanel ? () => show(item.label) : undefined}
              onMouseLeave={hasPanel ? hide : undefined}
              className="static"
            >
              <div className="flex items-center">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center px-3 text-sm tracking-wide uppercase transition-colors hover:text-primary",
                    item.highlight ? "font-medium text-brand-sale" : "text-brand-ink",
                    active && "underline decoration-brand-gold underline-offset-8",
                  )}
                >
                  {item.label}
                </Link>
                {hasPanel ? (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={`Show ${item.label} sub-categories`}
                    onClick={() => setOpen(isOpen ? null : item.label)}
                    className="-ml-2 flex size-8 items-center justify-center rounded-full text-brand-body hover:text-primary"
                  >
                    <ChevronDownIcon className={cn("size-4 transition", isOpen && "rotate-180")} />
                  </button>
                ) : null}
              </div>
              {hasPanel && isOpen ? (
                <div
                  className="absolute inset-x-0 top-full z-40 border-t border-b bg-background shadow-lg"
                  onMouseEnter={() => show(item.label)}
                  onMouseLeave={hide}
                >
                  <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] gap-8 px-6 py-8">
                    <div>
                      <p className="mb-3 font-heading text-2xl text-brand-ink">{item.label}</p>
                      <ul className="grid grid-cols-3 gap-x-8 gap-y-1">
                        <li>
                          <Link
                            href={item.href}
                            className="flex min-h-10 items-center text-sm font-medium text-primary hover:underline"
                          >
                            Shop all {item.label}
                          </Link>
                        </li>
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="flex min-h-10 items-center text-sm text-brand-body hover:text-primary"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {item.image ? (
                      <div className="relative h-48 w-40 overflow-hidden rounded-2xl bg-secondary">
                        <Image
                          src={cloudinaryUrl(item.image, 400)}
                          alt=""
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
