"use client";

import * as React from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Filter, Search, Wallet, X } from "lucide-react";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityIcon } from "@/components/shared/entity-icon";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import type { TransactionWithRelations } from "@/types";

function groupLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

// ─── Filter state ─────────────────────────────────────────────────────────────

interface Filters {
  type: string;
  accountId: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

const DEFAULT_FILTERS: Filters = {
  type: "all",
  accountId: "all",
  categoryId: "all",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

function countActiveFilters(f: Filters) {
  let n = 0;
  if (f.type !== "all") n++;
  if (f.accountId !== "all") n++;
  if (f.categoryId !== "all") n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  if (f.amountMin) n++;
  if (f.amountMax) n++;
  return n;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = React.useState<Filters>(DEFAULT_FILTERS);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const activeCount = countActiveFilters(filters);

  function openPopover() {
    setDraft(filters);
    setPopoverOpen(true);
  }

  function applyFilters() {
    setFilters(draft);
    setPopoverOpen(false);
  }

  function clearFilters() {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setPopoverOpen(false);
  }

  const { transactions, loading } = useTransactions({
    type: filters.type === "all" ? undefined : (filters.type as "income" | "expense" | "transfer"),
    accountId: filters.accountId === "all" ? undefined : filters.accountId,
    categoryId: filters.categoryId === "all" ? undefined : filters.categoryId,
    from: filters.dateFrom || undefined,
    to: filters.dateTo || undefined,
    amountMin: filters.amountMin ? Number(filters.amountMin) : undefined,
    amountMax: filters.amountMax ? Number(filters.amountMax) : undefined,
    search: search || undefined,
    limit: 500,
  });

  const grouped = React.useMemo(() => {
    const map = new Map<string, TransactionWithRelations[]>();
    for (const t of transactions) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return Array.from(map.entries());
  }, [transactions]);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Every move, with context"
        actions={
          <div className="hidden md:block">
            <AddTransactionDialog />
          </div>
        }
      />

      <PageSection className="space-y-4">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter popover */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                onClick={openPopover}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeCount > 0 && (
                  <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-4" onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Filters</p>
                  {countActiveFilters(draft) > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraft(DEFAULT_FILTERS)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" /> Clear all
                    </button>
                  )}
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select
                    value={draft.type}
                    onValueChange={(v) => setDraft((d) => ({ ...d, type: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Account */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Account</Label>
                  <Select
                    value={draft.accountId}
                    onValueChange={(v) => setDraft((d) => ({ ...d, accountId: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All accounts</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex items-center gap-2">
                            <EntityIcon icon={a.icon} color={a.color} fallback="account" size="xs" />
                            {a.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select
                    value={draft.categoryId}
                    onValueChange={(v) => setDraft((d) => ({ ...d, categoryId: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories
                        .filter((c) => !c.parent_id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <EntityIcon icon={c.icon} color={c.color} fallback="category" size="xs" />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date range */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={draft.dateFrom}
                        onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                        placeholder="From"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={draft.dateTo}
                        onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                        placeholder="To"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount range */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Amount range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      placeholder="Min"
                      min="0"
                      value={draft.amountMin}
                      onChange={(e) => setDraft((d) => ({ ...d, amountMin: e.target.value }))}
                    />
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      placeholder="Max"
                      min="0"
                      value={draft.amountMax}
                      onChange={(e) => setDraft((d) => ({ ...d, amountMax: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={clearFilters}>
                    Reset
                  </Button>
                  <Button size="sm" className="flex-1" onClick={applyFilters}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filters.type !== "all" && (
              <FilterChip label={filters.type} onRemove={() => setFilters((f) => ({ ...f, type: "all" }))} />
            )}
            {filters.accountId !== "all" && (
              <FilterChip
                label={accounts.find((a) => a.id === filters.accountId)?.name ?? "Account"}
                onRemove={() => setFilters((f) => ({ ...f, accountId: "all" }))}
              />
            )}
            {filters.categoryId !== "all" && (
              <FilterChip
                label={categories.find((c) => c.id === filters.categoryId)?.name ?? "Category"}
                onRemove={() => setFilters((f) => ({ ...f, categoryId: "all" }))}
              />
            )}
            {filters.dateFrom && (
              <FilterChip label={`From ${filters.dateFrom}`} onRemove={() => setFilters((f) => ({ ...f, dateFrom: "" }))} />
            )}
            {filters.dateTo && (
              <FilterChip label={`To ${filters.dateTo}`} onRemove={() => setFilters((f) => ({ ...f, dateTo: "" }))} />
            )}
            {filters.amountMin && (
              <FilterChip label={`≥ ${filters.amountMin}`} onRemove={() => setFilters((f) => ({ ...f, amountMin: "" }))} />
            )}
            {filters.amountMax && (
              <FilterChip label={`≤ ${filters.amountMax}`} onRemove={() => setFilters((f) => ({ ...f, amountMax: "" }))} />
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No transactions found"
            description="Try adjusting filters or add a new one"
            action={<AddTransactionDialog />}
          />
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, items]) => {
              const dayTotal = items.reduce((acc, t) => {
                if (t.type === "income") return acc + Number(t.amount);
                if (t.type === "expense") return acc - Number(t.amount);
                return acc;
              }, 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between px-1 pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {groupLabel(date)}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {dayTotal >= 0 ? "+" : "−"}
                      {Math.abs(dayTotal).toLocaleString("es-MX", {
                        style: "currency",
                        currency: items[0]?.currency ?? "MXN",
                      })}
                    </p>
                  </div>
                  <Card>
                    <CardContent className="p-2">
                      <div className="divide-y divide-border">
                        {items.map((t) => (
                          <TransactionRow key={t.id} t={t} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </PageSection>

      <AddTransactionDialog floating />
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium capitalize">
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 rounded-full hover:text-destructive">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
