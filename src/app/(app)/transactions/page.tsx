"use client";

import * as React from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Search, Wallet } from "lucide-react";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import type { TransactionWithRelations } from "@/types";

function groupLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

export default function TransactionsPage() {
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<string>("all");
  const [accountId, setAccountId] = React.useState<string>("all");
  const [categoryId, setCategoryId] = React.useState<string>("all");

  const { transactions, loading } = useTransactions({
    type: type === "all" ? undefined : (type as "income" | "expense" | "transfer"),
    accountId: accountId === "all" ? undefined : accountId,
    categoryId: categoryId === "all" ? undefined : categoryId,
    search: search || undefined,
    limit: 200,
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
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories
                  .filter((c) => !c.parent_id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
                      {Math.abs(dayTotal).toLocaleString("en-US", {
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
