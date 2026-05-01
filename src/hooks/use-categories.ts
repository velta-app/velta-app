"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useMutationListener } from "@/lib/data-bus";
import { createChannelName } from "@/lib/utils";
import type { Category, CategoryWithChildren } from "@/types";

export function useCategories(includeArchived = false) {
  const supabase = React.useMemo(() => createClient(), []);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (!includeArchived) q = q.eq("is_archived", false);
    const { data, error } = await q;
    if (error) setError(error.message);
    else {
      setCategories(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [supabase, includeArchived]);

  React.useEffect(() => {
    load();
  }, [load]);

  useMutationListener(["categories"], load);

  React.useEffect(() => {
    const channel = supabase
      .channel(createChannelName("categories-changes"))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  return { categories, loading, error, reload: load };
}

export function buildCategoryTree(cats: Category[]): CategoryWithChildren[] {
  const roots: CategoryWithChildren[] = [];
  const map = new Map<string, CategoryWithChildren>();

  cats.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else if (!node.parent_id) {
      roots.push(node);
    }
  });
  return roots;
}
