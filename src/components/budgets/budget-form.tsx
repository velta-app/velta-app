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
import { useSession } from "@/hooks/use-session";
import { useCategories } from "@/hooks/use-categories";
import {
  BUDGET_PERIODS,
  CURRENCIES,
  type BudgetPeriod,
} from "@/lib/constants";
import type { Budget } from "@/types";

interface BudgetFormProps {
  initial?: Partial<Budget>;
  onDone: () => void;
}

export function BudgetForm({ initial, onDone }: BudgetFormProps) {
  const { user, profile } = useSession();
  const supabase = React.useMemo(() => createClient(), []);
  const { categories } = useCategories();

  const [categoryId, setCategoryId] = React.useState(initial?.category_id ?? "");
  const [amount, setAmount] = React.useState(
    initial?.amount != null ? String(initial.amount) : ""
  );
  const [currency, setCurrency] = React.useState(
    initial?.currency ?? profile?.default_currency ?? "MXN"
  );
  const [period, setPeriod] = React.useState<BudgetPeriod>(
    (initial?.period as BudgetPeriod) ?? "monthly"
  );
  const [loading, setLoading] = React.useState(false);

  const expenseCats = categories.filter(
    (c) => c.type === "expense" && c.parent_id === null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      user_id: user.id,
      category_id: categoryId,
      amount: Number(amount),
      currency,
      period,
      start_date: initial?.start_date ?? format(new Date(), "yyyy-MM-dd"),
      is_active: true,
    };

    const { error } = initial?.id
      ? await supabase.from("budgets").update(payload).eq("id", initial.id)
      : await supabase.from("budgets").insert(payload);

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial?.id ? "Budget updated" : "Budget created");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {expenseCats.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
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
        <Label htmlFor="period">Period</Label>
        <Select value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
          <SelectTrigger id="period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {initial?.id ? "Save changes" : "Create budget"}
        <span className="ml-auto rounded border border-current/20 bg-current/10 px-1.5 tracking-widest text-base">⌘↵</span>
      </Button>
    </form>
  );
}
