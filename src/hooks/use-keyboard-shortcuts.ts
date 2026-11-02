"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDialogStore } from "@/lib/dialog-store";
import { NAV_ITEMS } from "@/components/layout/nav-items";

function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).isContentEditable
  );
}

/** Desktop niceties: single-key navigation, N = new expense, ⌘↵ submits a sheet. */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const openItem = useDialogStore((s) => s.openItem);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const inDialog = !!document.querySelector('[role="dialog"]');
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && inDialog) {
        const form = document.querySelector('[role="dialog"] form');
        if (form instanceof HTMLFormElement) {
          e.preventDefault();
          form.requestSubmit();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping() || inDialog) return;
      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        openItem();
        return;
      }
      const nav = NAV_ITEMS.find((n) => n.key === key);
      if (nav) {
        e.preventDefault();
        router.push(nav.href);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, openItem]);
}
