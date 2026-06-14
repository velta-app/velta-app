"use client";

import * as React from "react";
import { differenceInDays, format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Amount } from "@/components/shared/amount";
import { EmptyState } from "@/components/shared/empty-state";
import {
  PeriodSelector,
  PeriodNavigator,
  navigatedPeriodRange,
  type Period,
} from "@/components/shared/period-selector";
import { useSession } from "@/hooks/use-session";
import { useTransactions } from "@/hooks/use-transactions";
import { useNetWorthHistory } from "@/hooks/use-net-worth-history";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { profile } = useSession();
  const currency = profile?.default_currency ?? "MXN";
  const [period, setPeriod] = React.useState<Period>("month");
  const [offset, setOffset] = React.useState(0);

  // Reset offset when period changes
  React.useEffect(() => { setOffset(0); }, [period]);

  const { from, to, label } = React.useMemo(
    () => navigatedPeriodRange(period, offset),
    [period, offset]
  );

  const { transactions, loading } = useTransactions({
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  });

  const { data: netWorthHistory, loading: nwLoading } = useNetWorthHistory(13);

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
    const cats = Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
    return { income, expense, net: income - expense, cats };
  }, [transactions]);

  const days = Math.max(1, differenceInDays(to, from) + 1);
  const weeks = Math.max(1, Math.ceil(days / 7));
  const avgPerDay = totals.expense / days;
  const avgPerWeek = totals.expense / weeks;

  const name = profile?.first_name ?? "there";
  const todayStr = format(new Date(), "EEEE, MMM d");
  const currentNetWorth = netWorthHistory.at(-1)?.netWorth ?? 0;

  return (
    <div className="relative">
      <PageHeader
        title={`Hey ${name}`}
        description={todayStr}
        actions={
          <div className="flex items-center gap-2">
            <PeriodNavigator period={period} offset={offset} onOffsetChange={setOffset} />
            <PeriodSelector value={period} onChange={setPeriod} />
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
                const pct = totals.expense > 0 ? (c.total / totals.expense) * 100 : 0;
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

      <PageSection className="pt-0">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Net worth</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                13-month evolution
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">
                <Amount value={currentNetWorth} currency={currency} />
              </p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
          </CardHeader>
          <CardContent>
            {nwLoading ? (
              <div className="h-48 animate-pulse rounded-md bg-muted/60" />
            ) : (
              <NetWorthChart data={netWorthHistory} currency={currency} />
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
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {t.description ?? t.category?.name ??
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
