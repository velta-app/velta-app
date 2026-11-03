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
import { format } from "date-fns";
import { NOT_SET_ID, type MonthForecast } from "@/lib/budget";
import { NOT_SET_COLOR } from "@/lib/constants";
import { formatCurrency, type Currency } from "@/lib/utils";
import type { Bucket } from "@/types";

/** Planned spending per month, stacked by budget category. */
export function MonthlyChart({
  months,
  buckets,
  currency,
}: {
  months: MonthForecast[];
  buckets: Bucket[];
  currency: Currency;
}) {
  const ids = new Set(buckets.map((b) => b.id));
  const series = [
    ...buckets.map((b) => ({ id: b.id, name: b.name, color: b.color })),
    { id: NOT_SET_ID, name: "Not set", color: NOT_SET_COLOR },
  ];

  const data = months.map((m) => {
    const row: Record<string, number | string> = {
      key: m.key,
      label: format(m.start, months.length > 6 ? "MMM" : "MMM yy"),
      full: m.label,
    };
    for (const s of series) row[s.id] = 0;
    for (const o of m.occurrences) {
      if (o.past || o.item.kind !== "expense") continue;
      const id = o.item.bucket_id && ids.has(o.item.bucket_id) ? o.item.bucket_id : NOT_SET_ID;
      row[id] = (row[id] as number) + o.amount;
    }
    return row;
  });

  const used = series.filter((s) => data.some((d) => (d[s.id] as number) > 0));

  return (
    <div className="space-y-3">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval={0}
              minTickGap={0}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)
              }
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as Record<string, number | string>;
                const total = used.reduce((s, x) => s + (row[x.id] as number), 0);
                return (
                  <div className="min-w-44 rounded-lg border border-border bg-popover p-2.5 text-xs shadow-lg">
                    <p className="mb-1.5 font-semibold">{row.full}</p>
                    {used
                      .filter((s) => (row[s.id] as number) > 0)
                      .map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-3 py-0.5">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </span>
                          <span className="tabular-nums">
                            {formatCurrency(row[s.id] as number, currency)}
                          </span>
                        </div>
                      ))}
                    <div className="mt-1 flex justify-between border-t border-border pt-1 font-medium">
                      <span>Total</span>
                      <span className="tabular-nums">{formatCurrency(total, currency)}</span>
                    </div>
                  </div>
                );
              }}
            />
            {used.map((s, i) => (
              <Bar
                key={s.id}
                dataKey={s.id}
                name={s.name}
                stackId="spend"
                fill={s.color}
                stroke="var(--card)"
                strokeWidth={1}
                radius={i === used.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={28}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {used.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {used.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
