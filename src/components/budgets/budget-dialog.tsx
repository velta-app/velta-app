"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BudgetForm } from "./budget-form";
import type { Budget } from "@/types";

export function BudgetDialog({
  initial,
  trigger,
  controlled,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  initial?: Partial<Budget>;
  trigger?: React.ReactNode;
  controlled?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = controlled ? (controlledOpen ?? false) : localOpen;
  const setOpen = controlled ? (controlledOnOpenChange ?? (() => {})) : setLocalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="h-4 w-4" /> New budget
              <span className="ml-1.5 rounded border border-current/20 bg-current/10 px-1.5 tracking-widest text-sm">⌘B</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Edit budget" : "New budget"}
          </DialogTitle>
        </DialogHeader>
        <BudgetForm initial={initial} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
