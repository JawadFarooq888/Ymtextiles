"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminNav } from "@/features/admin/components/admin-nav";

export function MobileNav({ isAdmin = true }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-4">
        <SheetHeader className="px-0">
          <SheetTitle className="font-heading text-xl tracking-wide">YM TEXTILES</SheetTitle>
        </SheetHeader>
        <AdminNav isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
