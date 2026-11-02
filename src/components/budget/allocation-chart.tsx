"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BucketStat } from "@/lib/budget";
import { formatCurrency, type Currency } from "@/lib/utils";

/** Donut chart of the budget split. Slice size = percentage of money to budget. */
export function AllocationChart({
  buckets,
  base,
  currency,
  caption,
}: {
  buckets: BucketStat[];
  base: number;
  currency: Currency;
  caption: string;
}) {
  const data = buckets.filter((b) => b.percent > 0);
  const [active, setActive] = React.useState<string | null>(null);
  const focus = data.find((b) => b.id === active);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.length ? data : [{ id: "empty", percent: 1, color: "var(--muted)" }]}
            dataKey="percent"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 1.5 : 0}
            cornerRadius={4}
            stroke="var(--card)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
            onMouseEnter={(_, i) => setActive(data[i]?.id ?? null)}
            onMouseLeave={() => setActive(null)}
            onClick={(_, i) =>
              setActive((cur) => (cur === data[i]?.id ? null : data[i]?.id ?? null))
            }
          >
            {(data.length ? data : [{ id: "empty", color: "var(--muted)" }]).map(
              (b) => (
                <Cell
                  key={b.id}
                  fill={b.color}
                  opacity={!active || active === b.id ? 1 : 0.35}
                  className="cursor-pointer outline-none transition-opacity"
                />
              )
            )}
          </Pie>
          <Tooltip content={() => null} />
        </PieChart>
      </ResponsiveContainer>

      {/* center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
        <p className="text-xs font-medium text-muted-foreground">
          {focus ? focus.name : caption}
        </p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
          {formatCurrency(focus ? focus.allocated : base, currency, {
            compact: (focus ? focus.allocated : base) >= 1_000_000,
          })}
        </p>
        {focus && (
          <p className="text-sm font-medium tabular-nums text-muted-foreground">
            {Math.round(focus.percent * 10) / 10}%
          </p>
        )}
      </div>
    </div>
  );
}
