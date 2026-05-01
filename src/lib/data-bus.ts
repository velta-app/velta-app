"use client";

import * as React from "react";

export type EntityTable =
  | "accounts"
  | "categories"
  | "transactions"
  | "budgets"
  | "recurring_rules";

const EVENT_NAME = "velta:mutate";

export function emitMutation(...tables: EntityTable[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { tables } }));
}

export function useMutationListener(
  tables: EntityTable[],
  fn: () => void
) {
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const key = tables.join(",");

  React.useEffect(() => {
    const watched = new Set(key.split(",") as EntityTable[]);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { tables?: EntityTable[] }
        | undefined;
      if (!detail?.tables) return;
      if (detail.tables.some((t) => watched.has(t))) fnRef.current();
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [key]);
}
