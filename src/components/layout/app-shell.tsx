"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemForm } from "@/components/plans/item-form";
import { FundForm } from "@/components/funds/fund-form";
import { SplitEditor } from "@/components/budget/split-editor";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useDialogStore } from "@/lib/dialog-store";

/** Mounts keyboard shortcuts and the globally controlled sheets. */
export function AppShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return (
    <>
      {children}
      <GlobalDialogs />
    </>
  );
}

function GlobalDialogs() {
  const { item, fund, split, close } = useDialogStore();
  // Remount forms each time they open so state starts from `initial`.
  const itemKey = `${item.initial?.id ?? "new"}-${item.open}`;
  const fundKey = `${fund.initial?.id ?? "new"}-${fund.open}`;

  return (
    <>
      <Dialog open={item.open} onOpenChange={(o) => !o && close("item")}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {item.initial?.id ? "Edit" : "New planned expense"}
            </DialogTitle>
            <DialogDescription>
              Recurring bills, subscriptions, one-time plans like a trip — or expected income.
            </DialogDescription>
          </DialogHeader>
          <ItemForm key={itemKey} initial={item.initial} onDone={() => close("item")} />
        </DialogContent>
      </Dialog>

      <Dialog open={fund.open} onOpenChange={(o) => !o && close("fund")}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{fund.initial?.id ? "Update balance" : "Add money"}</DialogTitle>
            <DialogDescription>
              Where it sits doesn&apos;t matter — only how much you have.
            </DialogDescription>
          </DialogHeader>
          <FundForm key={fundKey} initial={fund.initial} onDone={() => close("fund")} />
        </DialogContent>
      </Dialog>

      <Dialog open={split} onOpenChange={(o) => !o && close("split")}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Budget split</DialogTitle>
            <DialogDescription>
              How your money is divided. Anything not assigned shows as “Not set”.
            </DialogDescription>
          </DialogHeader>
          {split && <SplitEditor onDone={() => close("split")} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
