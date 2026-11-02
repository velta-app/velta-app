"use client";

import * as React from "react";
import { AlertTriangle, CalendarRange, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { HorizonPicker } from "@/components/budget/horizon-picker";
import { MonthlyChart } from "@/components/forecast/monthly-chart";
import { ItemRow } from "@/components/plans/item-row";
import { Button } from "@/components/ui/button";
import { useBudget } from "@/hooks/use-budget";
import { useSession } from "@/hooks/use-session";
import { useDialogStore } from "@/lib/dialog-store";
import type { MonthForecast } from "@/lib/budget";
import { cn, formatCurrency, type Currency } from "@/lib/utils";
import type { Bucket } from "@/types";

export default function ForecastPage() {
  const { summary, buckets, items, currency, loading } = useBudget();
  const { profile } = useSession();
  const openItem = useDialogStore((s) => s.openItem);
  const buffer = Number(profile?.safety_buffer ?? 0);
  const bucketById = React.useMemo(
    () => new Map(buckets.map((b) => [b.id, b])),
    [buckets]
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Forecast"
        description="What leaves (and arrives) each month"
        className="hidden md:flex"
        actions={<HorizonPicker />}
      />
      <PageSection className="space-y-4">
        <div className="flex justify-end md:hidden">
          <HorizonPicker />
        </div>

        {loading ? (
          <Skeleton className="h-60" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Nothing planned yet"
            description="Add your recurring bills, subscriptions and future one-time expenses."
            action={<Button onClick={() => openItem()}>Add expense</Button>}
          />
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-sm font-semibold">Planned spending</p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(summary.committed, currency)} total
                  </p>
                </div>
                <MonthlyChart
                  months={summary.months}
                  buckets={buckets}
                  currency={currency}
                />
              </CardContent>
            </Card>

            <div className="space-y-3">
              {summary.months.map((m, i) => (
                <MonthCard
                  key={m.key}
                  month={m}
                  defaultOpen={i < 2}
                  currency={currency}
                  buffer={buffer}
                  bucketById={bucketById}
                />
              ))}
            </div>
          </>
        )}
      </PageSection>
    </div>
  );
}

function MonthCard({
  month,
  defaultOpen,
  currency,
  buffer,
  bucketById,
}: {
  month: MonthForecast;
  defaultOpen: boolean;
  currency: Currency;
  buffer: number;
  bucketById: Map<string, Bucket>;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const negative = month.endBalance < 0;
  const low = !negative && buffer > 0 && month.endBalance < buffer;

  return (
    <Card className={cn(negative && "border-destructive/40")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{month.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {formatCurrency(month.expenses, currency)} out
            {month.income > 0 && ` · ${formatCurrency(month.income, currency)} in`}
            {` · ${month.occurrences.length} item${month.occurrences.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">End balance</p>
          <p
            className={cn(
              "flex items-center justify-end gap-1 text-sm font-semibold tabular-nums",
              negative && "text-destructive",
              low && "text-amber-600 dark:text-amber-400"
            )}
          >
            {(negative || low) && <AlertTriangle className="h-3.5 w-3.5" aria-label="at risk" />}
            {formatCurrency(month.endBalance, currency)}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <CardContent className="border-t border-border px-4 pb-2 pt-0">
          {month.occurrences.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Nothing planned.</p>
          ) : (
            <div className="divide-y divide-border">
              {month.occurrences.map((o) => (
                <ItemRow
                  key={`${o.item.id}-${o.date.getTime()}`}
                  item={o.item}
                  bucket={o.item.bucket_id ? bucketById.get(o.item.bucket_id) : null}
                  date={o.date}
                  displayAmount={o.amount}
                  displayCurrency={currency}
                  muted={o.past}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
