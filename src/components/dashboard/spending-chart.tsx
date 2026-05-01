"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, eachDayOfInterval } from "date-fns";
import { formatCurrency, type Currency } from "@/lib/utils";
import type { TransactionWithRelations } from "@/types";

interface SpendingChartProps {
  transactions: TransactionWithRelations[];
  currency: Currency;
  from: Date;
  to: Date;
}

export function SpendingChart({
  transactions,
  currency,
  from,
  to,
}: SpendingChartProps) {
  const data = React.useMemo(() => {
    const byDay = new Map<
      string,
      { date: string; income: number; expense: number }
    >();

    for (const day of eachDayOfInterval({ start: from, end: to })) {
      const key = format(day, "yyyy-MM-dd");
      byDay.set(key, { date: key, income: 0, expense: 0 });
    }

    for (const t of transactions) {
      const entry = byDay.get(t.date);
      if (!entry) continue;
      if (t.type === "income") entry.income += Number(t.amount);
      else if (t.type === "expense") entry.expense += Number(t.amount);
    }

    return Array.from(byDay.values()).map((d) => ({
      ...d,
      label: format(new Date(d.date), "MMM d"),
    }));
  }, [transactions, from, to]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
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
            tickFormatter={(v) =>
              formatCurrency(v, currency, { compact: true })
            }
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
              name === "income" ? "Income" : "Expense",
            ]}
          />
          <Bar
            dataKey="income"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="expense"
            fill="var(--chart-5)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
