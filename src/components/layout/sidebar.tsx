"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/hooks/use-session";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { NAV_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useSession();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:shrink-0 md:border-r md:border-border md:bg-background/60 md:backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-5">
          <Link href="/" aria-label="Velta home">
            <Brand />
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const shortcut = NAV_SHORTCUTS.find((s) => s.href === item.href);
            return (
              <Link
                prefetch
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active && "text-primary"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {shortcut && (
                  <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] opacity-0 transition-opacity group-hover:opacity-60">
                    {shortcut.key.toUpperCase()}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>
                  {initials(
                    profile
                      ? `${profile.first_name} ${profile.last_name ?? ""}`
                      : undefined
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {profile?.first_name ?? "Guest"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile?.default_currency ?? "MXN"} default
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
