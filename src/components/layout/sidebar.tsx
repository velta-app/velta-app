"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { useSession } from "@/hooks/use-session";
import { useDialogStore } from "@/lib/dialog-store";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useSession();
  const openItem = useDialogStore((s) => s.openItem);

  return (
    <aside className="sticky top-0 hidden h-screen md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-background/60">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/" aria-label="Velta home">
          <Brand />
        </Link>
      </div>
      <div className="px-3 pb-2">
        <Button className="w-full justify-start" onClick={() => openItem()}>
          <Plus /> New expense
          <kbd className="ml-auto rounded border border-current/20 bg-current/10 px-1.5 font-mono text-[10px]">
            N
          </kbd>
        </Button>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              <span className="flex-1">{item.label}</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] opacity-0 transition-opacity group-hover:opacity-60">
                {item.key.toUpperCase()}
              </kbd>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-border p-3">
        <CurrencyToggle />
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">
            {profile?.first_name ?? "Me"}
          </p>
          <div className="flex items-center">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
