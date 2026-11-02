"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, SlidersHorizontal, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSection } from "@/components/layout/page-header";
import { AllocationChart } from "@/components/budget/allocation-chart";
import { BucketList } from "@/components/budget/bucket-list";
import { Warnings } from "@/components/budget/warnings";
import { HorizonPicker } from "@/components/budget/horizon-picker";
import { ItemRow } from "@/components/plans/item-row";
import { useBudget } from "@/hooks/use-budget";
import { useDialogStore } from "@/lib/dialog-store";
import { formatCurrency } from "@/lib/utils";

const STATUS = {
  on_track: { label: "On track", variant: "success" },
  at_risk: { label: "At risk", variant: "warning" },
  over: { label: "Over budget", variant: "destructive" },
} as const;

export default function BudgetPage() {
  const { summary, currency, loading, buckets, funds, horizon } = useBudget();
  const { openSplit, openFund } = useDialogStore();
  const status = STATUS[summary.status];
  const bucketById = new Map(buckets.map((b) => [b.id, b]));

  if (loading) return <BudgetSkeleton />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageSection className="space-y-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="hidden text-2xl font-semibold tracking-tight md:block">
              Budget
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-xs text-muted-foreground">
                next {horizon} month{horizon === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <HorizonPicker />
        </div>
      </PageSection>

      <PageSection className="grid grid-cols-[minmax(0,1fr)] gap-4 pt-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-5 p-5">
              <AllocationChart
                buckets={summary.buckets}
                base={summary.base}
                currency={currency}
                caption="Money to budget"
              />
              <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <Link
                  href="/money"
                  className="tabular-nums underline-offset-2 hover:underline"
                >
                  {formatCurrency(summary.totalFunds, currency)} you have
                </Link>
                {summary.base !== summary.totalFunds && (
                  <>
                    <span>+</span>
                    <Link
                      href="/forecast"
                      className="tabular-nums underline-offset-2 hover:underline"
                    >
                      {formatCurrency(summary.expectedIncome, currency)} expected income
                    </Link>
                  </>
                )}
              </div>
              <Button variant="subtle" className="w-full" onClick={openSplit}>
                <SlidersHorizontal /> Edit split
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Planned spending"
              value={formatCurrency(summary.committed, currency)}
              hint={`next ${horizon} mo`}
            />
            <Stat
              label="Recurring / month"
              value={formatCurrency(summary.monthlyRecurring, currency)}
              hint="average"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-2 pt-1">
              <BucketList buckets={summary.buckets} currency={currency} />
            </CardContent>
          </Card>

          <section className="space-y-2">
            <h2 className="px-1 text-sm font-semibold">Heads up</h2>
            {summary.warnings.length ? (
              <Warnings warnings={summary.warnings} />
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-apple-500/30 bg-apple-500/5 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-apple-700 dark:text-apple-400" />
                Everything fits your budget.
              </div>
            )}
          </section>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle>Coming up</CardTitle>
              <Link
                href="/forecast"
                className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Forecast <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="px-5 pb-3 pt-1">
              {summary.upcoming.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Nothing planned in the next 45 days.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {summary.upcoming.slice(0, 6).map((o) => (
                    <ItemRow
                      key={`${o.item.id}-${o.date.getTime()}`}
                      item={o.item}
                      bucket={o.item.bucket_id ? bucketById.get(o.item.bucket_id) : null}
                      date={o.date}
                      displayAmount={o.amount}
                      displayCurrency={currency}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {funds.length === 0 && (
            <Button size="lg" className="w-full" onClick={() => openFund()}>
              <Wallet /> Add how much money you have
            </Button>
          )}
        </div>
      </PageSection>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function BudgetSkeleton() {
  return (
    <PageSection className="mx-auto max-w-6xl space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mx-auto aspect-square w-full max-w-[280px] rounded-full" />
      <Skeleton className="h-48" />
    </PageSection>
  );
}
