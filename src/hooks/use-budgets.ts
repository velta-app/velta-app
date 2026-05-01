"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useMutationListener } from "@/lib/data-bus";
import { createChannelName } from "@/lib/utils";
import type { Budget, BudgetProgress } from "@/types";

export function useBudgets() {
  const supabase = React.useMemo(() => createClient(), []);
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [progress, setProgress] = React.useState<BudgetProgress[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from("budgets").select("*").eq("is_active", true),
      supabase.from("budget_progress").select("*"),
    ]);
    setBudgets(b ?? []);
    setProgress(p ?? []);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    load();
  }, [load]);

  useMutationListener(["budgets", "transactions"], load);

  React.useEffect(() => {
    const channel = supabase
      .channel(createChannelName("budgets-changes"))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budgets" },
        () => load()
      )
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

  return { budgets, progress, loading, reload: load };
}
