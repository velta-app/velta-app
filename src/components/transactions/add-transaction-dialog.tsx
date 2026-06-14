"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "./transaction-form";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";

interface AddTransactionDialogProps {
  initial?: Partial<Transaction>;
  trigger?: React.ReactNode;
  floating?: boolean;
  /** When true the dialog has no trigger — open/close is controlled externally. */
  controlled?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function AddTransactionDialog({
  initial,
  trigger,
  floating,
  controlled,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddTransactionDialogProps) {
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = controlled ? (controlledOpen ?? false) : localOpen;
  const setOpen = controlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setLocalOpen;

  const defaultTrigger = floating ? (
    <Button
      size="icon-lg"
      className={cn(
        "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-xl shadow-apple-700/40 md:hidden",
        "[&_svg]:size-6"
      )}
      aria-label="Add transaction"
    >
      <Plus />
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4" /> New transaction
      <span className="ml-1.5 rounded border border-current/20 bg-current/10 px-1.5 tracking-widest text-sm">⌘E</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlled && <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Edit transaction" : "New transaction"}
          </DialogTitle>
          <DialogDescription>
            Track your money with precision.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm initial={initial} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
