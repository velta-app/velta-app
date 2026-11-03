"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconColorPicker } from "@/components/shared/icon-color-picker";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import { useBudget } from "@/hooks/use-budget";
import { COLOR_PALETTE } from "@/lib/icons";
import { NOT_SET_COLOR } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

interface Row {
  id?: string;
  key: string;
  name: string;
  percent: string;
  color: string;
  icon: string | null;
}

const SUGGESTED = ["#3b82f6", "#db2777", "#00a63e", "#f59e0b", "#8b5cf6", "#0891b2", "#ef4444"];

/** Edit the budget split: categories and their percentages. */
export function SplitEditor({ onDone }: { onDone: () => void }) {
  const supabase = React.useMemo(() => createClient(), []);
  const { buckets, summary, currency } = useBudget();
  const [rows, setRows] = React.useState<Row[]>(() =>
    buckets.map((b) => ({
      id: b.id,
      key: b.id,
      name: b.name,
      percent: String(Number(b.percent)),
      color: b.color,
      icon: b.icon,
    }))
  );
  const [saving, setSaving] = React.useState(false);

  const total = rows.reduce((s, r) => s + (Number(r.percent) || 0), 0);
  const remainder = Math.round((100 - total) * 100) / 100;

  function patch(key: string, next: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...next } : r)));
  }

  function addRow() {
    const used = new Set(rows.map((r) => r.color));
    const color =
      SUGGESTED.find((c) => !used.has(c)) ??
      COLOR_PALETTE[rows.length % COLOR_PALETTE.length].value;
    setRows((rs) => [
      ...rs,
      {
        key: `new-${Date.now()}`,
        name: "",
        percent: String(Math.max(0, Math.min(remainder, 10))),
        color,
        icon: "pie-chart",
      },
    ]);
  }

  async function save() {
    if (total > 100.001) {
      toast.error(`The split adds up to ${total}% — keep it at 100% or less`);
      return;
    }
    if (rows.some((r) => !r.name.trim())) {
      toast.error("Every category needs a name");
      return;
    }
    setSaving(true);
    const keep = new Set(rows.filter((r) => r.id).map((r) => r.id!));
    const removed = buckets.filter((b) => !keep.has(b.id)).map((b) => b.id);
    const ops = [
      ...rows.map((r, i) => {
        const payload = {
          name: r.name.trim(),
          percent: Number(r.percent) || 0,
          color: r.color,
          icon: r.icon,
          sort_order: i,
        };
        return r.id
          ? supabase.from("buckets").update(payload).eq("id", r.id)
          : supabase.from("buckets").insert(payload);
      }),
      ...(removed.length
        ? [supabase.from("buckets").delete().in("id", removed)]
        : []),
    ];
    const results = await Promise.all(ops);
    setSaving(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error(failed.error.message);
      return;
    }
    toast.success("Split saved");
    emitMutation("buckets", "planned_items");
    onDone();
  }

  return (
    <div className="space-y-4">
      {/* stacked bar preview */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {rows.map((r) => (
          <div
            key={r.key}
            style={{
              width: `${Math.max(0, Number(r.percent) || 0)}%`,
              backgroundColor: r.color,
            }}
            className="transition-all"
          />
        ))}
        {remainder > 0 && (
          <div
            style={{ width: `${remainder}%`, backgroundColor: NOT_SET_COLOR }}
            className="opacity-40"
          />
        )}
      </div>

      <ul className="space-y-3">
        {rows.map((r) => {
          const pct = Number(r.percent) || 0;
          return (
            <li key={r.key} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <IconColorPicker
                  size="md"
                  icon={r.icon}
                  color={r.color}
                  onChange={(n) => patch(r.key, { icon: n.icon, color: n.color })}
                />
                <Input
                  value={r.name}
                  onChange={(e) => patch(r.key, { name: e.target.value })}
                  placeholder="Category name"
                  className="flex-1"
                  aria-label="Category name"
                />
                <div className="relative w-24">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.5"
                    value={r.percent}
                    onChange={(e) => patch(r.key, { percent: e.target.value })}
                    className="pr-7 text-right tabular-nums"
                    aria-label={`${r.name} percent`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  aria-label={`Remove ${r.name}`}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) => patch(r.key, { percent: e.target.value })}
                  className="h-1.5 flex-1 cursor-pointer"
                  style={{ accentColor: r.color }}
                  aria-label={`${r.name} percent slider`}
                />
                <span className="w-28 text-right text-xs tabular-nums text-muted-foreground">
                  {formatCurrency((summary.base * pct) / 100, currency)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <Button type="button" variant="outline" className="w-full" onClick={addRow}>
        <Plus /> Add category
      </Button>

      <div
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm",
          remainder < 0
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
        )}
      >
        <span>
          {remainder < 0 ? "Over by" : "Not set"}{" "}
          <span className="font-semibold tabular-nums">
            {Math.abs(remainder)}%
          </span>
        </span>
        <span className="tabular-nums">
          {formatCurrency((summary.base * Math.abs(remainder)) / 100, currency)}
        </span>
      </div>

      <Button size="lg" className="w-full" onClick={save} disabled={saving}>
        {saving && <Loader2 className="animate-spin" />}
        Save split
      </Button>
    </div>
  );
}
