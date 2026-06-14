"use client";

import * as React from "react";
import {
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useMutationListener } from "@/lib/data-bus";
import { createChannelName } from "@/lib/utils";

export interface NetWorthPoint {
  month: string; // "Jan 2026"
  netWorth: number;
}

/**
 * Computes monthly net worth over the past N months by walking backwards
 * from the current total account balance, reversing each month's
 * income/expense transactions.
 */
export function useNetWorthHistory(months = 13) {
  const supabase = React.useMemo(() => createClient(), []);
  const [data, setData] = React.useState<NetWorthPoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);

    // 1. Current net worth = sum of all included account balances
    const { data: accounts, error: accErr } = await supabase
      .from("accounts")
      .select("balance, type")
      .eq("include_in_total", true)
      .eq("is_archived", false);

    if (accErr || !accounts) {
      setLoading(false);
      return;
    }

    // debt accounts reduce net worth; others add to it
    let currentNetWorth = accounts.reduce((sum, a) => {
      const bal = Number(a.balance ?? 0);
      return a.type === "debt" ? sum - bal : sum + bal;
    }, 0);

    // 2. For each of the past N months, fetch income/expense totals
    //    We go from most recent to oldest, then reverse for display
    const points: NetWorthPoint[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = subMonths(now, i);
      const from = format(startOfMonth(date), "yyyy-MM-dd");
      const to = format(endOfMonth(date), "yyyy-MM-dd");

      // Record this month's snapshot BEFORE subtracting
      points.push({
        month: format(date, "MMM yyyy"),
        netWorth: Math.round(currentNetWorth * 100) / 100,
      });

      if (i < months - 1) {
        // Fetch this month's net flow to reverse back to previous month
        const { data: txs } = await supabase
          .from("transactions")
          .select("type, amount")
          .gte("date", from)
          .lte("date", to)
          .eq("affects_balance", true)
          .in("type", ["income", "expense"]);

        const flow = (txs ?? []).reduce((sum, t) => {
          if (t.type === "income") return sum + Number(t.amount);
          if (t.type === "expense") return sum - Number(t.amount);
          return sum;
        }, 0);

        currentNetWorth -= flow; // undo this month's flow to get last month's value
      }
    }

    setData(points.reverse()); // chronological order
    setLoading(false);
  }, [supabase, months]);

  React.useEffect(() => {
    load();
  }, [load]);

  useMutationListener(["transactions", "accounts"], load);

  React.useEffect(() => {
    const ch = supabase
      .channel(createChannelName("nw-history"))
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, load]);

  return { data, loading };
}
