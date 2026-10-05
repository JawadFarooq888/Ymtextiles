"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { MenuItem } from "@/features/catalog/collections";
import { cn } from "@/lib/utils";

export function MobileMenu({
  items,
  helpLinks,
}: {
  items: MenuItem[];
  helpLinks: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-11 lg:hidden" aria-label="Open menu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto bg-background p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="font-heading text-2xl tracking-widest">YM TEXTILES</SheetTitle>
          <SheetDescription className="sr-only">Shop menu</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile">
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.href}>
                {item.children.length ? (
                  <details className="group">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm tracking-wide uppercase">
                      <span className={cn(item.highlight ? "text-brand-sale" : "text-brand-ink")}>
                        {item.label}
                      </span>
                      <ChevronDownIcon
                        className="size-4 transition group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <ul className="bg-secondary/60 pb-2">
                      <li>
                        <Link
                          href={item.href}
                          onClick={close}
                          className="flex min-h-11 items-center px-8 text-sm font-medium text-primary"
                        >
                          Shop all {item.label}
                        </Link>
                      </li>
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={close}
                            className="flex min-h-11 items-center px-8 text-sm"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "flex min-h-12 items-center px-5 text-sm tracking-wide uppercase",
                      item.highlight ? "text-brand-sale" : "text-brand-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <ul className="mt-4 border-t px-5 py-4">
            {helpLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="flex min-h-11 items-center text-sm text-brand-body"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
