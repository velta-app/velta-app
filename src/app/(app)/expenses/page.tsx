"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startOfDay } from "date-fns";
import { Plus, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemRow } from "@/components/plans/item-row";
import { useBudget } from "@/hooks/use-budget";
import { useDialogStore } from "@/lib/dialog-store";
import { convert, monthlyEquivalent, nextOccurrence } from "@/lib/budget";
import { cn, formatCurrency, type Currency } from "@/lib/utils";
import type { PlannedItem } from "@/types";

export default function ExpensesPage() {
  return (
    <React.Suspense fallback={<PageSection><Skeleton className="h-60" /></PageSection>}>
      <Expenses />
    </React.Suspense>
  );
}

function Expenses() {
  const { items, buckets, loading, currency, rate } = useBudget();
  const openItem = useDialogStore((s) => s.openItem);
  const params = useSearchParams();
  const router = useRouter();
  const filter = params.get("bucket"); // bucket id | "none" | null
  const today = startOfDay(new Date());
  const bucketById = new Map(buckets.map((b) => [b.id, b]));
  const bucketIds = new Set(buckets.map((b) => b.id));

  // Home-screen shortcut: /expenses?new=1 opens the add sheet.
  const wantsNew = params.get("new") === "1";
  React.useEffect(() => {
    if (!wantsNew) return;
    openItem();
    router.replace("/expenses", { scroll: false });
  }, [wantsNew, openItem, router]);

  const setFilter = (v: string | null) =>
    router.replace(v ? `/expenses?bucket=${v}` : "/expenses", { scroll: false });

  const visible = items.filter((i) => {
    if (!filter) return true;
    if (i.kind === "income") return false;
    if (filter === "none") return !i.bucket_id || !bucketIds.has(i.bucket_id);
    return i.bucket_id === filter;
  });

  const toDisplay = (i: PlannedItem, amount = Number(i.amount)) =>
    convert(amount, i.currency as Currency, currency, rate);

  const recurring = visible
    .filter((i) => i.kind === "expense" && i.frequency !== "one_time")
    .sort((a, b) => toDisplay(b, monthlyEquivalent(b)) - toDisplay(a, monthlyEquivalent(a)));
  const oneTime = visible
    .filter((i) => i.kind === "expense" && i.frequency === "one_time")
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const upcomingOneTime = oneTime.filter((i) => nextOccurrence(i, today));
  const pastOneTime = oneTime.filter((i) => !nextOccurrence(i, today));
  const income = visible.filter((i) => i.kind === "income");

  const monthlyTotal = recurring
    .filter((i) => i.is_active)
    .reduce((s, i) => s + toDisplay(i, monthlyEquivalent(i)), 0);
  const oneTimeTotal = upcomingOneTime
    .filter((i) => i.is_active)
    .reduce((s, i) => s + toDisplay(i), 0);

  const row = (i: PlannedItem) => {
    const next = nextOccurrence(i, today);
    return (
      <ItemRow
        key={i.id}
        item={i}
        bucket={i.bucket_id ? bucketById.get(i.bucket_id) : null}
        displayAmount={toDisplay(i)}
        displayCurrency={currency}
        muted={!next}
        subtitle={[
          next
            ? `Next ${next.toLocaleDateString("en-US", { month: "short", day: "numeric", year: next.getFullYear() !== today.getFullYear() ? "numeric" : undefined })}`
            : i.frequency === "one_time"
              ? "Done"
              : "Ended",
          i.kind === "income"
            ? "Income"
            : (i.bucket_id && bucketById.get(i.bucket_id)?.name) || "Not set",
          !i.is_active ? "Paused" : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Expenses"
        description="Recurring bills, subscriptions and future plans"
        className="hidden md:flex"
        actions={
          <Button onClick={() => openItem()}>
            <Plus /> New
          </Button>
        }
      />
      <PageSection className="space-y-4">
        {/* filter chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
          <Chip active={!filter} onClick={() => setFilter(null)}>
            All
          </Chip>
          {buckets.map((b) => (
            <Chip
              key={b.id}
              active={filter === b.id}
              color={b.color}
              onClick={() => setFilter(b.id)}
            >
              {b.name}
            </Chip>
          ))}
          <Chip active={filter === "none"} onClick={() => setFilter("none")}>
            Not set
          </Chip>
        </div>

        {loading ? (
          <Skeleton className="h-60" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={filter ? "Nothing in this category" : "No planned expenses yet"}
            description="Add rent, subscriptions, insurance, a trip — anything that will cost you money."
            action={
              <Button onClick={() => openItem({ bucket_id: filter && filter !== "none" ? filter : null })}>
                <Plus /> Add expense
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Recurring</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatCurrency(monthlyTotal, currency)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">per month, on average</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">One-time ahead</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatCurrency(oneTimeTotal, currency)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {upcomingOneTime.length} planned
                  </p>
                </CardContent>
              </Card>
            </div>

            <Group title="Recurring" items={recurring} render={row} />
            <Group title="One-time" items={upcomingOneTime} render={row} />
            <Group title="Expected income" items={income} render={row} />
            <Group title="Past one-time" items={pastOneTime} render={row} />
          </>
        )}
      </PageSection>
    </div>
  );
}

function Group({
  title,
  items,
  render,
}: {
  title: string;
  items: PlannedItem[];
  render: (i: PlannedItem) => React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold">
        {title} <span className="font-normal text-muted-foreground">{items.length}</span>
      </h2>
      <Card>
        <CardContent className="divide-y divide-border px-4 py-1">
          {items.map(render)}
        </CardContent>
      </Card>
    </section>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {color && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {children}
    </button>
  );
}
