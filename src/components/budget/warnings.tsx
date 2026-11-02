"use client";

import Link from "next/link";
import { AlertOctagon, AlertTriangle, ChevronRight, Info } from "lucide-react";
import type { BudgetWarning } from "@/lib/budget";
import { cn } from "@/lib/utils";

const STYLE = {
  danger: {
    icon: AlertOctagon,
    box: "border-destructive/30 bg-destructive/5",
    ink: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    box: "border-amber-500/30 bg-amber-500/5",
    ink: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Info,
    box: "border-border bg-muted/40",
    ink: "text-muted-foreground",
  },
} as const;

export function Warnings({ warnings }: { warnings: BudgetWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-2">
      {warnings.map((w) => {
        const s = STYLE[w.level];
        const Icon = s.icon;
        const body = (
          <>
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.ink)} aria-label={w.level} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{w.title}</p>
              {w.detail && (
                <p className="mt-0.5 text-xs text-muted-foreground">{w.detail}</p>
              )}
            </div>
            {w.href && (
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
            )}
          </>
        );
        const cls = cn("flex items-start gap-3 rounded-xl border p-3", s.box);
        return (
          <li key={w.id}>
            {w.href ? (
              <Link href={w.href} className={cn(cls, "active:opacity-70")}>
                {body}
              </Link>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
