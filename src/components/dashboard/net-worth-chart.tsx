"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, type Currency } from "@/lib/utils";
import type { NetWorthPoint } from "@/hooks/use-net-worth-history";

interface NetWorthChartProps {
  data: NetWorthPoint[];
  currency: Currency;
}

export function NetWorthChart({ data, currency }: NetWorthChartProps) {
  const hasData = data.some((d) => d.netWorth !== 0);

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Not enough data yet — add transactions to see your net worth over time.
      </div>
    );
  }

  const min = Math.min(...data.map((d) => d.netWorth));
  const max = Math.max(...data.map((d) => d.netWorth));
  const padding = (max - min) * 0.1 || 1000;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[min - padding, max + padding]}
            tickFormatter={(v) => formatCurrency(v, currency, { compact: true })}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            formatter={(v) => [formatCurrency(Number(v), currency), "Net worth"]}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#nwGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--chart-1)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
