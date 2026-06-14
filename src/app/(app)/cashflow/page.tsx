"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Bar,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Amount } from "@/components/shared/amount";
import { PeriodSelector, PeriodNavigator, navigatedPeriodRange, type Period } from "@/components/shared/period-selector";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { useCashflow } from "@/hooks/use-cashflow";
import { useSession } from "@/hooks/use-session";
import { formatCurrency } from "@/lib/utils";

export default function CashflowPage() {
  const { profile } = useSession();
  const currency = profile?.default_currency ?? "MXN";
  const [period, setPeriod] = React.useState<Period>("year");
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => { setOffset(0); }, [period]);

  const { from, to, label } = React.useMemo(() => navigatedPeriodRange(period, offset), [period, offset]);
  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");

  const { data, loading } = useCashflow(fromStr, toStr);

  const showMonthlyChart = data && data.monthly.length > 1;
  const isSingleMonth = data && data.monthly.length === 1;

  return (
    <div>
      <PageHeader
        title="Cashflow"
        description="Income, expenses, and where your money flows"
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

      {/* Summary cards */}
      <PageSection className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label={`Income · ${label}`}
          value={data?.totalIncome ?? 0}
          currency={currency}
          icon={ArrowDownLeft}
          intent="income"
        />
        <SummaryCard
          label={`Expenses · ${label}`}
          value={data?.totalExpense ?? 0}
          currency={currency}
          icon={ArrowUpRight}
          intent="expense"
        />
        <SummaryCard
          label="Net cashflow"
          value={data?.totalNet ?? 0}
          currency={currency}
          icon={TrendingUp}
          intent={(data?.totalNet ?? 0) >= 0 ? "income" : "expense"}
        />
      </PageSection>

      {/* Monthly bar chart */}
      <PageSection className="pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Monthly cashflow</CardTitle>
            <p className="text-xs text-muted-foreground">
              Income and expenses by month · {label}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 animate-pulse rounded-md bg-muted/60" />
            ) : !showMonthlyChart ? (
              <SingleMonthBar
                income={data?.totalIncome ?? 0}
                expense={data?.totalExpense ?? 0}
                currency={currency}
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={20}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v, currency, { compact: true })}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(v, name) => [
                        formatCurrency(Number(v), currency),
                        name === "income" ? "Income" : name === "expense" ? "Expenses" : "Net",
                      ]}
                    />
                    <ReferenceLine y={0} stroke="var(--border)" />
                    <Bar dataKey="income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expense" fill="var(--chart-5)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </PageSection>

      {/* Category breakdowns */}
      <PageSection className="grid gap-4 pt-0 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense categories</CardTitle>
            <p className="text-xs text-muted-foreground">Where your money went</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted/60" />
                ))}
              </div>
            ) : !data || data.topExpenseCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expense data for this period.</p>
            ) : (
              data.topExpenseCategories.map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{c.name}</span>
                    <div className="flex items-center gap-2 tabular-nums">
                      <Amount value={c.total} currency={currency} />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {c.percent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={c.percent} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income sources</CardTitle>
            <p className="text-xs text-muted-foreground">Where your money came from</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted/60" />
                ))}
              </div>
            ) : !data || data.topIncomeCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income data for this period.</p>
            ) : (
              data.topIncomeCategories.map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{c.name}</span>
                    <div className="flex items-center gap-2 tabular-nums">
                      <Amount value={c.total} currency={currency} />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {c.percent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={c.percent} className="[&>div]:bg-chart-1" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </PageSection>

      <AddTransactionDialog floating />
    </div>
  );
}

function SingleMonthBar({
  income,
  expense,
  currency,
}: {
  income: number;
  expense: number;
  currency: string;
}) {
  const max = Math.max(income, expense, 1);
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Income</span>
          <Amount value={income} currency={currency as "MXN" | "USD"} />
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-chart-1 transition-all"
            style={{ width: `${(income / max) * 100}%` }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Expenses</span>
          <Amount value={expense} currency={currency as "MXN" | "USD"} />
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-chart-5 transition-all"
            style={{ width: `${(expense / max) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
