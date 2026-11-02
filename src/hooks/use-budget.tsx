"use client";

import * as React from "react";
import { differenceInHours, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useMutationListener } from "@/lib/data-bus";
import { computeBudget, type BudgetSummary } from "@/lib/budget";
import { createChannelName, type Currency } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import type { TablesUpdate } from "@/lib/supabase/types";
import type { Bucket, Fund, PlannedItem } from "@/types";

interface BudgetData {
  funds: Fund[];
  buckets: Bucket[];
  items: PlannedItem[];
  loading: boolean;
  summary: BudgetSummary;
  currency: Currency;
  rate: number;
  horizon: number;
  reload: () => Promise<void>;
}

const BudgetContext = React.createContext<BudgetData | undefined>(undefined);

/**
 * Loads funds, buckets and planned items once for the whole app and keeps
 * them fresh via local mutation events + Supabase realtime. All screens read
 * from here so navigation between tabs is instant on mobile.
 */
export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => createClient(), []);
  const { user, profile, refresh } = useSession();
  const [funds, setFunds] = React.useState<Fund[]>([]);
  const [buckets, setBuckets] = React.useState<Bucket[]>([]);
  const [items, setItems] = React.useState<PlannedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const [f, b, i] = await Promise.all([
      supabase.from("funds").select("*").order("sort_order").order("created_at"),
      supabase.from("buckets").select("*").order("sort_order").order("created_at"),
      supabase.from("planned_items").select("*").order("start_date"),
    ]);
    if (f.data) setFunds(f.data);
    if (b.data) setBuckets(b.data);
    if (i.data) setItems(i.data);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
    const channel = supabase
      .channel(createChannelName("budget-changes"))
      .on("postgres_changes", { event: "*", schema: "public", table: "funds" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "buckets" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "planned_items" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  useMutationListener(["funds", "buckets", "planned_items"], load);
  useMutationListener(["profiles"], refresh);

  // Keep the USD→MXN rate fresh (once a day) when auto-update is on.
  React.useEffect(() => {
    if (!user || !profile?.fx_auto) return;
    const last = profile.fx_updated_at ? parseISO(profile.fx_updated_at) : null;
    if (last && differenceInHours(new Date(), last) < 20) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/fx", { cache: "no-store" });
        if (!res.ok) return;
        const { rate } = (await res.json()) as { rate?: number };
        if (cancelled || !rate) return;
        await supabase
          .from("profiles")
          .update({ usd_mxn_rate: rate, fx_updated_at: new Date().toISOString() })
          .eq("id", user.id);
        refresh();
      } catch {
        // offline — keep the last known rate
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.fx_auto, profile?.fx_updated_at, supabase, refresh]);

  const currency = (profile?.default_currency ?? "MXN") as Currency;
  const rate = Number(profile?.usd_mxn_rate ?? 18.5);
  const horizon = profile?.horizon_months ?? 12;
  const includeIncome = profile?.include_income ?? true;
  const safetyBuffer = Number(profile?.safety_buffer ?? 0);

  const summary = React.useMemo(
    () =>
      computeBudget(funds, buckets, items, {
        displayCurrency: currency,
        rate,
        horizonMonths: horizon,
        includeIncome,
        safetyBuffer,
      }),
    [funds, buckets, items, currency, rate, horizon, includeIncome, safetyBuffer]
  );

  const value = React.useMemo(
    () => ({
      funds,
      buckets,
      items,
      loading,
      summary,
      currency,
      rate,
      horizon,
      reload: load,
    }),
    [funds, buckets, items, loading, summary, currency, rate, horizon, load]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = React.useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used inside <BudgetProvider>");
  return ctx;
}

/** Update a profile preference and refresh the session. */
export function useUpdateProfile() {
  const supabase = React.useMemo(() => createClient(), []);
  const { user, refresh } = useSession();
  return React.useCallback(
    async (patch: TablesUpdate<"profiles">) => {
      if (!user) return { error: new Error("Not signed in") };
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id);
      if (!error) await refresh();
      return { error };
    },
    [supabase, user, refresh]
  );
}
