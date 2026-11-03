"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useDialogStore } from "@/lib/dialog-store";
import { cn } from "@/lib/utils";
import { MOBILE_NAV_ITEMS, isActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const openItem = useDialogStore((s) => s.openItem);
  const left = MOBILE_NAV_ITEMS.slice(0, 2);
  const right = MOBILE_NAV_ITEMS.slice(2);

  const renderItem = (item: (typeof MOBILE_NAV_ITEMS)[number]) => {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            "flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors",
            active ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
          <span className="leading-none">{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5 items-center">
        {left.map(renderItem)}
        <li className="flex justify-center">
          <button
            type="button"
            onClick={() => openItem()}
            aria-label="Add expense"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </li>
        {right.map(renderItem)}
      </ul>
    </nav>
  );
}
