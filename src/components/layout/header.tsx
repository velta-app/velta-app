"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { NAV_ITEMS, isActive } from "./nav-items";

export function Header() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => isActive(pathname, item.href));

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl md:hidden">
      <div className="flex h-12 items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="Velta home" className="flex items-center gap-2">
          <Brand iconOnly size="sm" />
          <span className="text-base font-semibold tracking-tight">
            {current?.label ?? "Velta"}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <CurrencyToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
