"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useMutationListener } from "@/lib/data-bus";
import { createChannelName } from "@/lib/utils";
import type { TransactionWithRelations } from "@/types";

interface UseTransactionsOptions {
  from?: string;
  to?: string;
  limit?: number;
  type?: "income" | "expense" | "transfer";
  categoryId?: string;
  accountId?: string;
  search?: string;
  amountMin?: number;
  amountMax?: number;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [transactions, setTransactions] = React.useState<TransactionWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const { from, to, limit, type, categoryId, accountId, search, amountMin, amountMax } = options;

  const load = React.useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("transactions")
      .select(
        `*,
         category:categories ( id, name, icon, color, type, parent_id ),
         from_account:accounts!transactions_from_account_id_fkey ( id, name, icon, color, currency ),
         to_account:accounts!transactions_to_account_id_fkey ( id, name, icon, color, currency )`
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (from) q = q.gte("date", from);
    if (to) q = q.lte("date", to);
    if (type) q = q.eq("type", type);
    if (categoryId) q = q.eq("category_id", categoryId);
    if (accountId)
      q = q.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);
    if (search) q = q.ilike("description", `%${search}%`);
    if (amountMin != null) q = q.gte("amount", amountMin);
    if (amountMax != null) q = q.lte("amount", amountMax);
    if (limit) q = q.limit(limit);

    const { data, error } = await q;
    if (error) setError(error.message);
    else {
      setTransactions((data ?? []) as unknown as TransactionWithRelations[]);
      setError(null);
    }
    setLoading(false);
  }, [supabase, from, to, limit, type, categoryId, accountId, search, amountMin, amountMax]);

  React.useEffect(() => {
    load();
  }, [load]);

  useMutationListener(["transactions"], load);

  React.useEffect(() => {
    const channel = supabase
      .channel(createChannelName("transactions-changes"))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  return { transactions, loading, error, reload: load };
}
