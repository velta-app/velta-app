"use client";

import * as React from "react";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ItemLogo } from "@/components/shared/item-logo";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import { useBudget } from "@/hooks/use-budget";
import {
  CURRENCIES,
  FREQUENCIES,
  ITEM_KINDS,
  type Frequency,
  type ItemKind,
} from "@/lib/constants";
import { guessDomain, normalizeDomain } from "@/lib/vendor-logo";
import { cn, type Currency } from "@/lib/utils";
import type { PlannedItem } from "@/types";

export function ItemForm({
  initial,
  onDone,
}: {
  initial?: Partial<PlannedItem>;
  onDone: () => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const { buckets, currency: defaultCurrency } = useBudget();
  const editing = Boolean(initial?.id);

  const [kind, setKind] = React.useState<ItemKind>(
    (initial?.kind as ItemKind) ?? "expense"
  );
  const [name, setName] = React.useState(initial?.name ?? "");
  const [amount, setAmount] = React.useState(
    initial?.amount != null ? String(initial.amount) : ""
  );
  const [currency, setCurrency] = React.useState<Currency>(
    (initial?.currency as Currency) ?? defaultCurrency
  );
  const [frequency, setFrequency] = React.useState<Frequency>(
    (initial?.frequency as Frequency) ?? "monthly"
  );
  const [startDate, setStartDate] = React.useState(
    initial?.start_date ?? format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = React.useState(initial?.end_date ?? "");
  const [bucketId, setBucketId] = React.useState<string | null>(
    initial?.bucket_id ?? null
  );
  const [domain, setDomain] = React.useState(initial?.logo_domain ?? "");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [active, setActive] = React.useState(initial?.is_active ?? true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const oneTime = frequency === "one_time";
  const guessed = guessDomain(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!name.trim() || !(value > 0)) {
      toast.error("Add a name and an amount greater than 0");
      return;
    }
    if (!oneTime && endDate && endDate < startDate) {
      toast.error("End date must be after the first payment");
      return;
    }
    setSaving(true);
    const payload = {
      kind,
      name: name.trim(),
      amount: value,
      currency,
      frequency,
      start_date: startDate,
      end_date: oneTime ? null : endDate || null,
      bucket_id: kind === "expense" ? bucketId : null,
      logo_domain: normalizeDomain(domain),
      note: note.trim() || null,
      is_active: active,
    };
    const { error } = editing
      ? await supabase.from("planned_items").update(payload).eq("id", initial!.id!)
      : await supabase.from("planned_items").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Saved" : `${kind === "income" ? "Income" : "Expense"} added`);
    emitMutation("planned_items");
    onDone();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm(`Delete “${initial.name}”?`)) return;
    setDeleting(true);
    const { error } = await supabase
      .from("planned_items")
      .delete()
      .eq("id", initial.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    emitMutation("planned_items");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SegmentedControl
        value={kind}
        onChange={(v) => setKind(v as ItemKind)}
        options={ITEM_KINDS.map((k) => ({ value: k.value, label: k.label }))}
      />

      <div className="space-y-2">
        <Label htmlFor="item-name">Name</Label>
        <div className="flex items-center gap-3">
          <ItemLogo name={name} domain={domain} />
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === "income" ? "Salary" : "Netflix, rent, trip to Japan…"}
            autoComplete="off"
            required
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="item-amount">Amount</Label>
          <Input
            id="item-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
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

      <div className="space-y-2">
        <Label>How often</Label>
        <div className="grid grid-cols-3 gap-2">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                frequency === f.value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid gap-3", !oneTime && "grid-cols-2")}>
        <div className="space-y-2">
          <Label htmlFor="item-start">{oneTime ? "Date" : "First payment"}</Label>
          <Input
            id="item-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        {!oneTime && (
          <div className="space-y-2">
            <Label htmlFor="item-end">
              Ends <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="item-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {kind === "expense" && (
        <div className="space-y-2">
          <Label>Budget category</Label>
          <div className="flex flex-wrap gap-2">
            {buckets.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBucketId(b.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  bucketId === b.id
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
                style={bucketId === b.id ? { backgroundColor: b.color } : undefined}
              >
                {bucketId !== b.id && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                )}
                {b.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBucketId(null)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                bucketId === null
                  ? "border-foreground/40 bg-muted text-foreground"
                  : "border-dashed border-border text-muted-foreground hover:bg-muted"
              )}
            >
              Not set
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="item-domain">
            Logo website <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="item-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={guessed ?? "netflix.com"}
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="url"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-note">
            Note <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="item-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {editing && (
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">
              Paused items are ignored by the forecast
            </p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      )}

      <div className="flex gap-2">
        {editing && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete"
            className="text-destructive"
          >
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Add"}
        </Button>
      </div>
    </form>
  );
}
