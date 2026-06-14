"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useDialogStore } from "@/lib/dialog-store";

/** Returns true if a form element is currently focused. */
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

export const NAV_SHORTCUTS: { key: string; href: string; label: string }[] = [
  { key: "h", href: "/", label: "Dashboard" },
  { key: "a", href: "/accounts", label: "Accounts" },
  { key: "c", href: "/cashflow", label: "Cashflow" },
  { key: "t", href: "/transactions", label: "Transactions" },
  { key: "k", href: "/categories", label: "Categories" },
  { key: "b", href: "/budgets", label: "Budgets" },
  { key: "r", href: "/recurring", label: "Recurring" },
  { key: "s", href: "/settings", label: "Settings" },
  { key: "i", href: "/import", label: "Import" },
];

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { setTransactionOpen, setAccountOpen, setBudgetOpen, setRecurringOpen } =
    useDialogStore();

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const withCmd = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;
      const noMod = !e.metaKey && !e.ctrlKey && !e.altKey;
      const inDialog = !!document.querySelector('[role="dialog"]');

      // ── Cmd/Ctrl + Enter = submit the open dialog's form ───────────────
      if (withCmd && e.key === "Enter") {
        if (inDialog) {
          const form = document.querySelector('[role="dialog"] form');
          if (form instanceof HTMLFormElement) {
            e.preventDefault();
            form.requestSubmit();
          }
        }
        return;
      }

      // ── Cmd/Ctrl + key = action shortcuts ──────────────────────────────
      // Safe letters: E (new transaction), A (account), B (budget), I (recurring), M (theme)
      // Avoided: T (new tab), R (reload), N (new window), W (close tab)
      if (withCmd) {
        if (isTyping() || inDialog) return;
        switch (key) {
          case "e":
            e.preventDefault();
            setTransactionOpen(true);
            break;
          case "a":
            e.preventDefault();
            setAccountOpen(true);
            break;
          case "b":
            e.preventDefault();
            setBudgetOpen(true);
            break;
          case "i":
            e.preventDefault();
            setRecurringOpen(true);
            break;
          case "m":
            e.preventDefault();
            setTheme(resolvedTheme === "dark" ? "light" : "dark");
            break;
        }
        return;
      }

      // ── Single key = navigate (no modifier) ────────────────────────────
      if (!noMod) return;
      if (isTyping() || inDialog) return;

      const nav = NAV_SHORTCUTS.find((s) => s.key === key);
      if (nav) {
        e.preventDefault();
        router.push(nav.href);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, resolvedTheme, setTheme, setTransactionOpen, setAccountOpen, setBudgetOpen, setRecurringOpen]);
}
