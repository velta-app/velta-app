"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconColorPicker } from "@/components/shared/icon-color-picker";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import { useBudget } from "@/hooks/use-budget";
import { CURRENCIES } from "@/lib/constants";
import type { Currency } from "@/lib/utils";
import type { Fund } from "@/types";

export function FundForm({
  initial,
  onDone,
}: {
  initial?: Partial<Fund>;
  onDone: () => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const { funds, currency: defaultCurrency } = useBudget();
  const editing = Boolean(initial?.id);

  const [name, setName] = React.useState(initial?.name ?? "");
  const [amount, setAmount] = React.useState(
    initial?.amount != null ? String(initial.amount) : ""
  );
  const [currency, setCurrency] = React.useState<Currency>(
    (initial?.currency as Currency) ?? defaultCurrency
  );
  const [icon, setIcon] = React.useState(initial?.icon ?? "wallet");
  const [color, setColor] = React.useState(initial?.color ?? "#00a63e");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: name.trim() || "Money",
      amount: Number(amount) || 0,
      currency,
      icon,
      color,
    };
    const { error } = editing
      ? await supabase.from("funds").update(payload).eq("id", initial!.id!)
      : await supabase
          .from("funds")
          .insert({ ...payload, sort_order: funds.length });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Balance updated" : "Added");
    emitMutation("funds");
    onDone();
  }

  async function handleDelete() {
    if (!initial?.id || !window.confirm(`Remove “${initial.name}”?`)) return;
    const { error } = await supabase.from("funds").delete().eq("id", initial.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    emitMutation("funds");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-end gap-4">
        <IconColorPicker
          icon={icon}
          color={color}
          fallback="account"
          onChange={(next) => {
            setIcon(next.icon);
            setColor(next.color);
          }}
        />
        <div className="flex-1 space-y-2">
          <Label htmlFor="fund-name">Name</Label>
          <Input
            id="fund-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="BBVA, cash, savings…"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="fund-amount">Current balance</Label>
          <Input
            id="fund-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            autoFocus={editing}
            className="text-lg font-semibold tabular-nums"
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <SegmentedControl
            value={currency}
            onChange={(v) => setCurrency(v as Currency)}
            options={CURRENCIES.map((c) => ({ value: c.value, label: c.value }))}
            className="h-11 md:h-10"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {editing && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleDelete}
            aria-label="Delete"
            className="text-destructive"
          >
            <Trash2 />
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Save" : "Add money"}
        </Button>
      </div>
    </form>
  );
}
