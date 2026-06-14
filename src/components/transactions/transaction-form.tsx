"use client";

import * as React from "react";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EntityIcon } from "@/components/shared/entity-icon";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "@/hooks/use-session";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import {
  CURRENCIES,
  TRANSACTION_TYPES,
  type TransactionType,
} from "@/lib/constants";
import type { Currency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

type Editable = Partial<Omit<Transaction, "id" | "user_id">> & {
  id?: string;
};

interface TransactionFormProps {
  initial?: Editable;
  onDone: () => void;
}

type Step = "picker" | "form";

export function TransactionForm({ initial, onDone }: TransactionFormProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const { user, profile } = useSession();
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
  const [date, setDate] = React.useState(
    initial?.date ?? format(new Date(), "yyyy-MM-dd")
  );
  const [categoryId, setCategoryId] = React.useState(
    initial?.category_id ?? ""
  );
  const [fromAccountId, setFromAccountId] = React.useState(
    initial?.from_account_id ?? ""
  );
  const [toAccountId, setToAccountId] = React.useState(
    initial?.to_account_id ?? ""
  );
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [affectsBalance, setAffectsBalance] = React.useState(
    initial?.affects_balance ?? true
  );
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const shouldSkipPicker =
    !!initial?.id ||
    (type !== "transfer" && !!categoryId) ||
    (type === "transfer" && !!fromAccountId);

  const [step, setStep] = React.useState<Step>(
    shouldSkipPicker ? "form" : "picker"
  );

  const rootCategories = React.useMemo(
    () =>
      categories.filter(
        (c) =>
          c.parent_id === null &&
          c.type === (type === "income" ? "income" : "expense")
      ),
    [categories, type]
  );

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const rootCategory = selectedCategory
    ? selectedCategory.parent_id
      ? categories.find((c) => c.id === selectedCategory.parent_id)
      : selectedCategory
    : null;
  const subcategories = rootCategory
    ? categories.filter((c) => c.parent_id === rootCategory.id)
    : [];

  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId);

  function pickCategory(id: string) {
    setCategoryId(id);
    setStep("form");
  }

  function pickFromAccount(id: string) {
    setFromAccountId(id);
    setStep("form");
  }

  function backToPicker() {
    setStep("picker");
    if (type !== "transfer") setCategoryId("");
    else setFromAccountId("");
  }

  function handleTypeChange(next: TransactionType) {
    setType(next);
    if (next === "transfer") {
      setCategoryId("");
      if (!fromAccountId) setStep("picker");
    } else {
      setFromAccountId("");
      if (!categoryId) setStep("picker");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const payload = {
      user_id: user.id,
      type,
      amount: numAmount,
      currency,
      date,
      description: description || null,
      note: note || null,
      category_id: type === "transfer" ? null : categoryId || null,
      from_account_id:
        type === "expense" || type === "transfer" ? fromAccountId || null : null,
      to_account_id:
        type === "income" || type === "transfer" ? toAccountId || null : null,
      affects_balance: affectsBalance,
    };

    if (type === "expense" && !payload.from_account_id) {
      toast.error("Select an account");
      return;
    }
    if (type === "income" && !payload.to_account_id) {
      toast.error("Select a destination account");
      return;
    }
    if (type === "transfer") {
      if (!payload.from_account_id || !payload.to_account_id) {
        toast.error("Select both accounts");
        return;
      }
      if (payload.from_account_id === payload.to_account_id) {
        toast.error("Accounts must differ");
        return;
      }
    }

    setLoading(true);
    const { error } = initial?.id
      ? await supabase.from("transactions").update(payload).eq("id", initial.id)
      : await supabase.from("transactions").insert(payload);

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial?.id ? "Transaction updated" : "Transaction added");
    emitMutation("transactions");
    emitMutation("accounts");
    onDone();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm("Delete this transaction? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", initial.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transaction deleted");
    emitMutation("transactions");
    emitMutation("accounts");
    onDone();
  }

  return (
    <div className="space-y-4">
      {/* Type tabs — always visible */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-1">
        {TRANSACTION_TYPES.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleTypeChange(opt.value)}
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

      {step === "picker" ? (
        type === "transfer" ? (
          <AccountPicker
            accounts={accounts}
            onPick={pickFromAccount}
            emptyLabel="Create an account first"
            headline="From which account?"
          />
        ) : (
          <CategoryPicker
            categories={rootCategories}
            onPick={pickCategory}
            emptyLabel={`Create a ${type} category first`}
            headline={`Pick a ${type} category`}
          />
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected chip */}
          {type !== "transfer" && selectedCategory && (
            <SelectedChip
              onBack={backToPicker}
              icon={rootCategory?.icon}
              color={rootCategory?.color}
              fallback="category"
              primary={rootCategory?.name ?? selectedCategory.name}
              secondary={
                selectedCategory.parent_id ? selectedCategory.name : null
              }
            />
          )}
          {type === "transfer" && selectedFromAccount && (
            <SelectedChip
              onBack={backToPicker}
              icon={selectedFromAccount.icon}
              color={selectedFromAccount.color}
              fallback="account"
              primary={selectedFromAccount.name}
              secondary="From account"
            />
          )}

          {/* Subcategory strip */}
          {type !== "transfer" && rootCategory && subcategories.length > 0 && (
            <SubcategoryStrip
              subs={subcategories}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Netflix, Salary, OXXO"
              required
            />
          </div>

          {/* Amount + currency */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
                className="text-lg font-semibold tabular-nums"
              />
            </div>
            <div className="w-28 space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
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

          {/* Account(s) */}
          {(type === "expense" || type === "transfer") && (
            <div className="space-y-2">
              <Label>
                {type === "transfer" ? "From account" : "Account"}
              </Label>
              <AccountSelect
                accounts={accounts}
                value={fromAccountId}
                onChange={setFromAccountId}
                placeholder="Select an account"
              />
            </div>
          )}
          {(type === "income" || type === "transfer") && (
            <div className="space-y-2">
              <Label>
                {type === "transfer" ? "To account" : "Deposit to"}
              </Label>
              <AccountSelect
                accounts={accounts}
                value={toAccountId}
                onChange={setToAccountId}
                placeholder="Select an account"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={note ?? ""}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="affects_balance" className="text-sm font-medium cursor-pointer">
                Affect account balance
              </Label>
              <p className="text-xs text-muted-foreground">
                Uncheck to record without changing your balance
              </p>
            </div>
            <Switch
              id="affects_balance"
              checked={affectsBalance}
              onCheckedChange={setAffectsBalance}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || deleting}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial?.id ? "Save changes" : "Add transaction"}
            <span className="ml-auto rounded border border-current/20 bg-current/10 px-1.5 tracking-widest text-base">⌘↵</span>
          </Button>
          {initial?.id && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              disabled={loading || deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete transaction
            </Button>
          )}
        </form>
      )}
    </div>
  );
}

function AccountSelect({
  accounts,
  value,
  onChange,
  placeholder = "Select an account",
}: {
  accounts: { id: string; name: string; icon: string | null; color: string | null }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = accounts.find((a) => a.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center gap-2.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "hover:bg-accent",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? (
            <>
              <EntityIcon icon={selected.icon} color={selected.color} fallback="account" size="xs" />
              <span className="flex-1 truncate text-left">{selected.name}</span>
            </>
          ) : (
            <span className="flex-1 text-left">{placeholder}</span>
          )}
          <svg className="ml-auto h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        <div className="space-y-0.5">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { onChange(a.id); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent",
                a.id === value && "bg-accent"
              )}
            >
              <EntityIcon icon={a.icon} color={a.color} fallback="account" size="xs" />
              <span className="flex-1 truncate text-left">{a.name}</span>
              {a.id === value && (
                <svg className="h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              )}
            </button>
          ))}
          {accounts.length === 0 && (
            <p className="px-2.5 py-2 text-sm text-muted-foreground">No accounts yet</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CategoryPicker({
  categories,
  onPick,
  emptyLabel,
  headline,
}: {
  categories: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  }[];
  onPick: (id: string) => void;
  emptyLabel: string;
  headline: string;
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {headline}
      </p>
      <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto pb-1 sm:grid-cols-4">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2 text-center transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <EntityIcon
              icon={c.icon}
              color={c.color}
              fallback="category"
              size="md"
            />
            <span className="line-clamp-2 text-xs font-medium">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AccountPicker({
  accounts,
  onPick,
  emptyLabel,
  headline,
}: {
  accounts: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  }[];
  onPick: (id: string) => void;
  emptyLabel: string;
  headline: string;
}) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {headline}
      </p>
      <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto pb-1 sm:grid-cols-4">
        {accounts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a.id)}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2 text-center transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <EntityIcon
              icon={a.icon}
              color={a.color}
              fallback="account"
              size="md"
            />
            <span className="line-clamp-2 text-xs font-medium">{a.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectedChip({
  onBack,
  icon,
  color,
  fallback,
  primary,
  secondary,
}: {
  onBack: () => void;
  icon?: string | null;
  color?: string | null;
  fallback: "account" | "category";
  primary: string;
  secondary?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-left transition-colors hover:bg-muted"
      aria-label="Change selection"
    >
      <EntityIcon icon={icon} color={color} fallback={fallback} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{primary}</p>
        {secondary && (
          <p className="truncate text-xs text-muted-foreground">{secondary}</p>
        )}
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Change
      </span>
    </button>
  );
}

function SubcategoryStrip({
  subs,
  selectedId,
  onSelect,
}: {
  subs: { id: string; name: string; icon: string | null; color: string | null }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Subcategory</Label>
      <ScrollArea>
        <div className="flex gap-1.5 pb-2">
          {subs.map((s) => (
            <SubPill
              key={s.id}
              label={s.name}
              selected={selectedId === s.id}
              onClick={() => onSelect(s.id)}
            />
          ))}
          <SubPill label="New" icon={<Plus className="h-3 w-3" />} disabled />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function SubPill({
  label,
  selected,
  onClick,
  icon,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-muted",
        disabled && "opacity-40"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
