"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_ITEMS } from "./nav-items";

export function Header() {
  const pathname = usePathname();

  const current = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  return (
    <header className="safe-top sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Velta home">
          <Brand iconOnly size="sm" />
        </Link>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {current?.label ?? "Velta"}
        </span>
      </div>
      <ThemeToggle />
    </header>
  );
}
