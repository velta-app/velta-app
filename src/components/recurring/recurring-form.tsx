"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import { useSession } from "@/hooks/use-session";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import {
  CURRENCIES,
  FREQUENCIES,
  TRANSACTION_TYPES,
  type Frequency,
  type TransactionType,
} from "@/lib/constants";
import type { Currency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RecurringRule } from "@/types";

interface RecurringFormProps {
  initial?: Partial<RecurringRule>;
  onDone: () => void;
}

export function RecurringForm({ initial, onDone }: RecurringFormProps) {
  const { user, profile } = useSession();
  const supabase = React.useMemo(() => createClient(), []);
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [type, setType] = React.useState<TransactionType>(
    (initial?.type as TransactionType) ?? "expense"
  );
  const [amount, setAmount] = React.useState(
    initial?.amount != null ? String(initial.amount) : ""
  );
  const [currency, setCurrency] = React.useState<Currency>(
    (initial?.currency as Currency) ?? profile?.default_currency ?? "MXN"
  );
  const [frequency, setFrequency] = React.useState<Frequency>(
    (initial?.frequency as Frequency) ?? "monthly"
  );
  const [startDate, setStartDate] = React.useState(
    initial?.start_date ?? format(new Date(), "yyyy-MM-dd")
  );
  const [categoryId, setCategoryId] = React.useState(initial?.category_id ?? "");
  const [fromAccountId, setFromAccountId] = React.useState(
    initial?.from_account_id ?? ""
  );
  const [toAccountId, setToAccountId] = React.useState(
    initial?.to_account_id ?? ""
  );
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [loading, setLoading] = React.useState(false);

  const catOptions = categories.filter(
    (c) =>
      c.parent_id === null &&
      c.type === (type === "income" ? "income" : "expense")
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      user_id: user.id,
      type,
      amount: Number(amount),
      currency,
      frequency,
      start_date: startDate,
      next_occurrence: initial?.next_occurrence ?? startDate,
      note: note || null,
      category_id: type === "transfer" ? null : categoryId || null,
      from_account_id:
        type === "expense" || type === "transfer" ? fromAccountId || null : null,
      to_account_id:
        type === "income" || type === "transfer" ? toAccountId || null : null,
      is_active: true,
    };

    const { error } = initial?.id
      ? await supabase.from("recurring_rules").update(payload).eq("id", initial.id)
      : await supabase.from("recurring_rules").insert(payload);

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial?.id ? "Recurring rule updated" : "Recurring rule created");
    emitMutation("recurring_rules");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-1">
        {TRANSACTION_TYPES.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              type === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="text-lg font-semibold tabular-nums"
          />
        </div>
        <div className="w-28 space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
          <SelectTrigger id="frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type !== "transfer" && (
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {catOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(type === "expense" || type === "transfer") && (
        <div className="space-y-2">
          <Label htmlFor="from_account">
            {type === "transfer" ? "From account" : "Account"}
          </Label>
          <Select value={fromAccountId} onValueChange={setFromAccountId}>
            <SelectTrigger id="from_account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(type === "income" || type === "transfer") && (
        <div className="space-y-2">
          <Label htmlFor="to_account">
            {type === "transfer" ? "To account" : "Deposit to"}
          </Label>
          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger id="to_account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="start_date">Start date</Label>
        <Input
          id="start_date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Input
          id="note"
          value={note ?? ""}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Rent, subscription, etc."
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {initial?.id ? "Save changes" : "Create recurring"}
      </Button>
    </form>
  );
}
