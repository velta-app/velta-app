"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EntityIcon } from "@/components/shared/entity-icon";
import { NOT_SET_ID, type BucketStat } from "@/lib/budget";
import { cn, formatCurrency, type Currency } from "@/lib/utils";

/** Legend + per-category health: share, amount, and how much is already planned. */
export function BucketList({
  buckets,
  currency,
}: {
  buckets: BucketStat[];
  currency: Currency;
}) {
  return (
    <ul className="divide-y divide-border">
      {buckets.map((b) => {
        const pct = Math.min(100, (b.usage || 0) * 100);
        return (
          <li key={b.id}>
            <Link
              href={`/expenses?bucket=${b.id === NOT_SET_ID ? "none" : b.id}`}
              className="flex items-center gap-3 py-3 active:opacity-70"
            >
              {b.id === NOT_SET_ID ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground">
                  ?
                </span>
              ) : (
                <EntityIcon icon={b.icon ?? "pie-chart"} color={b.color} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {b.name}{" "}
                    <span className="font-normal text-muted-foreground tabular-nums">
                      {Math.round(b.percent * 10) / 10}%
                    </span>
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(b.allocated, currency)}
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        b.status === "over"
                          ? "var(--destructive)"
                          : b.status === "warning"
                            ? "var(--warning)"
                            : b.color,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                  <span>
                    {formatCurrency(b.committed, currency)} planned
                  </span>
                  <span
                    className={cn(
                      b.status === "over" && "font-medium text-destructive",
                      b.status === "warning" && "font-medium text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {b.remaining < 0
                      ? `${formatCurrency(-b.remaining, currency)} over`
                      : `${formatCurrency(b.remaining, currency)} left`}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
