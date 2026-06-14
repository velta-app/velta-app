"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { IconColorPicker } from "@/components/shared/icon-color-picker";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { ACCOUNT_TYPES, CURRENCIES, type AccountType } from "@/lib/constants";
import { emitMutation } from "@/lib/data-bus";
import { DEFAULT_ACCOUNT_ICON, DEFAULT_COLOR } from "@/lib/icons";
import type { Account } from "@/types";

interface AccountFormProps {
  initial?: Partial<Account>;
  onDone: () => void;
}

export function AccountForm({ initial, onDone }: AccountFormProps) {
  const { user, profile } = useSession();
  const supabase = React.useMemo(() => createClient(), []);

  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  const [type, setType] = React.useState<AccountType>(
    (initial?.type as AccountType) ?? "regular"
  );
  const [currency, setCurrency] = React.useState(
    initial?.currency ?? profile?.default_currency ?? "MXN"
  );
  const [balance, setBalance] = React.useState(
    initial?.balance != null ? String(initial.balance) : ""
  );
  const [creditLimit, setCreditLimit] = React.useState(
    initial?.credit_limit != null ? String(initial.credit_limit) : ""
  );
  const [totalDebt, setTotalDebt] = React.useState(
    initial?.total_debt != null ? String(initial.total_debt) : ""
  );
  const [owedToMe, setOwedToMe] = React.useState(
    initial?.owed_to_me != null ? String(initial.owed_to_me) : ""
  );
  const [goalAmount, setGoalAmount] = React.useState(
    initial?.goal_amount != null ? String(initial.goal_amount) : ""
  );
  const [icon, setIcon] = React.useState<string>(
    initial?.icon ?? DEFAULT_ACCOUNT_ICON
  );
  const [color, setColor] = React.useState<string>(
    initial?.color ?? DEFAULT_COLOR
  );
  const [includeInTotal, setIncludeInTotal] = React.useState(
    initial?.include_in_total ?? true
  );
  const [loading, setLoading] = React.useState(false);

  const parseOrNull = (v: string) =>
    v === "" || Number.isNaN(Number(v)) ? null : Number(v);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      user_id: user.id,
      name: name.trim(),
      description: description || null,
      type,
      currency,
      icon,
      color,
      balance: balance ? Number(balance) : 0,
      credit_limit: type === "regular" ? parseOrNull(creditLimit) : null,
      total_debt: type === "debt" ? parseOrNull(totalDebt) : null,
      owed_to_me: type === "debt" ? parseOrNull(owedToMe) : null,
      goal_amount: type === "savings" ? parseOrNull(goalAmount) : null,
      include_in_total: includeInTotal,
    };

    const { error } = initial?.id
      ? await supabase.from("accounts").update(payload).eq("id", initial.id)
      : await supabase.from("accounts").insert(payload);

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial?.id ? "Account updated" : "Account created");
    emitMutation("accounts");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        <IconColorPicker
          icon={icon}
          color={color}
          onChange={(v) => {
            setIcon(v.icon);
            setColor(v.color);
          }}
          fallback="account"
        />
        <p className="text-xs text-muted-foreground">Tap to customize</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as typeof currency)}
          >
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

      {type === "regular" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="balance">Account balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creditLimit">Credit limit</Label>
            <Input
              id="creditLimit"
              type="number"
              step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </>
      )}

      {type === "debt" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="owedToMe">I am owed</Label>
            <Input
              id="owedToMe"
              type="number"
              step="0.01"
              value={owedToMe}
              onChange={(e) => setOwedToMe(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalDebt">Total debt</Label>
            <Input
              id="totalDebt"
              type="number"
              step="0.01"
              value={totalDebt}
              onChange={(e) => setTotalDebt(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </>
      )}

      {type === "savings" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="balance">Account balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goalAmount">Goal</Label>
            <Input
              id="goalAmount"
              type="number"
              step="0.01"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <div>
          <Label htmlFor="includeInTotal" className="text-sm">
            Include in total balance
          </Label>
          <p className="text-xs text-muted-foreground">
            Counts toward your net worth on the dashboard
          </p>
        </div>
        <Switch
          id="includeInTotal"
          checked={includeInTotal}
          onCheckedChange={setIncludeInTotal}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {initial?.id ? "Save changes" : "Create account"}
        <span className="ml-auto rounded border border-current/20 bg-current/10 px-1.5 tracking-widest text-base">⌘↵</span>
      </Button>
    </form>
  );
}
