"use client";

import * as React from "react";
import {
  endOfMonth,
  format,
  startOfMonth,
  differenceInDays,
  startOfWeek,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Amount } from "@/components/shared/amount";
import { EmptyState } from "@/components/shared/empty-state";
import { useSession } from "@/hooks/use-session";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";

type Range = "day" | "week" | "month" | "year" | "all";

function rangeOf(range: Range): { from: Date; to: Date; label: string } {
  const now = new Date();
  if (range === "day")
    return { from: startOfDay(now), to: endOfDay(now), label: "Today" };
  if (range === "week")
    return {
      from: startOfWeek(now, { weekStartsOn: 1 }),
      to: endOfDay(now),
      label: "This week",
    };
  if (range === "year")
    return { from: startOfYear(now), to: endOfYear(now), label: "This year" };
  if (range === "all")
    return {
      from: new Date(2000, 0, 1),
      to: endOfDay(now),
      label: "All time",
    };
  return { from: startOfMonth(now), to: endOfMonth(now), label: "This month" };
}

export default function DashboardPage() {
  const { profile } = useSession();
  const currency = profile?.default_currency ?? "MXN";
  const [range, setRange] = React.useState<Range>("month");

  const { from, to, label } = React.useMemo(() => rangeOf(range), [range]);

  const { transactions, loading } = useTransactions({
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  });

  const totals = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory = new Map<string, { name: string; total: number }>();
    for (const t of transactions) {
      if (t.type === "income") income += Number(t.amount);
      if (t.type === "expense") {
        expense += Number(t.amount);
        const cname = t.category?.name ?? "Uncategorized";
        const prev = byCategory.get(cname) ?? { name: cname, total: 0 };
        prev.total += Number(t.amount);
        byCategory.set(cname, prev);
      }
    }
    const cats = Array.from(byCategory.values()).sort(
      (a, b) => b.total - a.total
    );
    return { income, expense, net: income - expense, cats };
  }, [transactions]);

  const days = Math.max(1, differenceInDays(to, from) + 1);
  const weeks = Math.max(1, Math.ceil(days / 7));
  const avgPerDay = totals.expense / days;
  const avgPerWeek = totals.expense / weeks;

  const name = profile?.first_name ?? "there";
  const todayStr = format(new Date(), "EEEE, MMM d");

  return (
    <div className="relative">
      <PageHeader
        title={`Hey ${name}`}
        description={todayStr}
        actions={
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="year">This year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden md:block">
              <AddTransactionDialog />
            </div>
          </div>
        }
      />

      <PageSection className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label={`Income · ${label}`}
          value={totals.income}
          currency={currency}
          icon={ArrowDownLeft}
          intent="income"
        />
        <SummaryCard
          label={`Expenses · ${label}`}
          value={totals.expense}
          currency={currency}
          icon={ArrowUpRight}
          intent="expense"
        />
        <SummaryCard
          label="Net"
          value={totals.net}
          currency={currency}
          icon={TrendingUp}
          intent={totals.net >= 0 ? "income" : "expense"}
          hint={`Avg ${formatCurrency(avgPerDay, currency, { compact: true })}/day`}
        />
      </PageSection>

      <PageSection className="grid gap-4 pt-0 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income vs. expenses</CardTitle>
            <p className="text-xs text-muted-foreground">
              Daily flow for {label.toLowerCase()}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 animate-pulse rounded-md bg-muted/60" />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No transactions yet"
                description="Add your first transaction to see your flow"
                className="h-64"
              />
            ) : (
              <SpendingChart
                transactions={transactions}
                currency={currency}
                from={from}
                to={to}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categories</CardTitle>
            <p className="text-xs text-muted-foreground">
              Where your money is going
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {totals.cats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No expenses yet in this period.
              </p>
            ) : (
              totals.cats.slice(0, 6).map((c) => {
                const pct =
                  totals.expense > 0 ? (c.total / totals.expense) * 100 : 0;
                return (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{c.name}</span>
                      <div className="flex items-center gap-2 tabular-nums">
                        <Amount value={c.total} currency={currency} />
                        <span className="text-xs text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </PageSection>

      <PageSection className="grid gap-4 pt-0 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Averages</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Per day</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                <Amount value={avgPerDay} currency={currency} />
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Per week</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                <Amount value={avgPerWeek} currency={currency} />
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {t.category?.name ??
                      (t.type === "transfer" ? "Transfer" : "Uncategorized")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {format(new Date(t.date), "MMM d")} ·{" "}
                    {t.from_account?.name ?? t.to_account?.name ?? "—"}
                  </p>
                </div>
                <Amount
                  value={t.amount}
                  currency={t.currency}
                  intent={t.type}
                  signed={t.type !== "transfer"}
                />
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No activity yet — add your first transaction.
              </p>
            )}
          </CardContent>
        </Card>
      </PageSection>

      <AddTransactionDialog floating />
    </div>
  );
}
