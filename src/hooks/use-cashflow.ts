"use client";

import * as React from "react";
import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useMutationListener } from "@/lib/data-bus";
import { createChannelName } from "@/lib/utils";
import type { TransactionWithRelations } from "@/types";

export interface CashflowMonth {
  month: string;   // "Jan 2026"
  income: number;
  expense: number;
  net: number;
}

export interface CategoryTotal {
  name: string;
  color: string | null;
  icon: string | null;
  total: number;
  percent: number;
}

export interface CashflowData {
  monthly: CashflowMonth[];
  topExpenseCategories: CategoryTotal[];
  topIncomeCategories: CategoryTotal[];
  totalIncome: number;
  totalExpense: number;
  totalNet: number;
  transactions: TransactionWithRelations[];
}

export function useCashflow(from: string, to: string) {
  const supabase = React.useMemo(() => createClient(), []);
  const [data, setData] = React.useState<CashflowData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);

    const { data: txs } = await supabase
      .from("transactions")
      .select(
        `*,
         category:categories ( id, name, icon, color, type, parent_id ),
         from_account:accounts!transactions_from_account_id_fkey ( id, name, icon, color, currency ),
         to_account:accounts!transactions_to_account_id_fkey ( id, name, icon, color, currency )`
      )
      .gte("date", from)
      .lte("date", to)
      .in("type", ["income", "expense"])
      .order("date", { ascending: false });

    const transactions = (txs ?? []) as unknown as TransactionWithRelations[];

    // Build monthly buckets over the range
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const months = eachMonthOfInterval({ start: fromDate, end: toDate });

    const monthMap = new Map<string, CashflowMonth>();
    for (const m of months) {
      const key = format(m, "MMM yyyy");
      monthMap.set(key, { month: key, income: 0, expense: 0, net: 0 });
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const expCats = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>();
    const incCats = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>();

    for (const t of transactions) {
      const key = format(startOfMonth(new Date(t.date)), "MMM yyyy");
      const bucket = monthMap.get(key);
      const amount = Number(t.amount);

      if (t.type === "income") {
        if (bucket) bucket.income += amount;
        totalIncome += amount;
        if (t.category) {
          const catName = t.category.name;
          const prev = incCats.get(catName) ?? { name: catName, color: t.category.color, icon: t.category.icon, total: 0 };
          prev.total += amount;
          incCats.set(catName, prev);
        }
      } else if (t.type === "expense") {
        if (bucket) bucket.expense += amount;
        totalExpense += amount;
        if (t.category) {
          const catName = t.category.name;
          const prev = expCats.get(catName) ?? { name: catName, color: t.category.color, icon: t.category.icon, total: 0 };
          prev.total += amount;
          expCats.set(catName, prev);
        }
      }
    }

    const monthly = Array.from(monthMap.values()).map((m) => ({
      ...m,
      net: m.income - m.expense,
    }));

    const topExpenseCategories: CategoryTotal[] = Array.from(expCats.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((c) => ({
        ...c,
        percent: totalExpense > 0 ? (c.total / totalExpense) * 100 : 0,
      }));

    const topIncomeCategories: CategoryTotal[] = Array.from(incCats.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((c) => ({
        ...c,
        percent: totalIncome > 0 ? (c.total / totalIncome) * 100 : 0,
      }));

    setData({
      monthly,
      topExpenseCategories,
      topIncomeCategories,
      totalIncome,
      totalExpense,
      totalNet: totalIncome - totalExpense,
      transactions,
    });
    setLoading(false);
  }, [supabase, from, to]);

  React.useEffect(() => { load(); }, [load]);

  useMutationListener(["transactions"], load);

  React.useEffect(() => {
    const ch = supabase
      .channel(createChannelName("cashflow-changes"))
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, load]);

  return { data, loading };
}
