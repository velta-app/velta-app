"use client";

import * as React from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useDialogStore } from "@/lib/dialog-store";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { RecurringDialog } from "@/components/recurring/recurring-dialog";

/** Mounts global keyboard shortcuts and renders globally-controlled dialogs. */
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
  const {
    transactionOpen, setTransactionOpen,
    accountOpen, setAccountOpen,
    budgetOpen, setBudgetOpen,
    recurringOpen, setRecurringOpen,
  } = useDialogStore();

  return (
    <>
      <AddTransactionDialog controlled open={transactionOpen} onOpenChange={setTransactionOpen} />
      <AccountDialog controlled open={accountOpen} onOpenChange={setAccountOpen} />
      <BudgetDialog controlled open={budgetOpen} onOpenChange={setBudgetOpen} />
      <RecurringDialog controlled open={recurringOpen} onOpenChange={setRecurringOpen} />
    </>
  );
}
