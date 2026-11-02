"use client";

import * as React from "react";

export type EntityTable = "funds" | "buckets" | "planned_items" | "profiles";

const EVENT_NAME = "velta:mutate";

/** Notify listeners that a table changed locally (instant refresh, no waiting on realtime). */
export function emitMutation(...tables: EntityTable[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { tables } }));
}

export function useMutationListener(tables: EntityTable[], fn: () => void) {
  const fnRef = React.useRef(fn);
  React.useEffect(() => {
    fnRef.current = fn;
  });
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
