"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useMutationListener } from "@/lib/data-bus";
import { createChannelName } from "@/lib/utils";
import type { Account } from "@/types";

export function useAccounts(includeArchived = false) {
  const supabase = React.useMemo(() => createClient(), []);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("accounts")
      .select("*")
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true });
    if (!includeArchived) q = q.eq("is_archived", false);
    const { data, error } = await q;
    if (error) setError(error.message);
    else {
      setAccounts(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [supabase, includeArchived]);

  React.useEffect(() => {
    load();
  }, [load]);

  useMutationListener(["accounts"], load);

  React.useEffect(() => {
    const channel = supabase
      .channel(createChannelName("accounts-changes"))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  return { accounts, loading, error, reload: load };
}
