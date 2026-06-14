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
import { RecurringForm } from "./recurring-form";
import type { RecurringRule } from "@/types";

export function RecurringDialog({
  initial,
  trigger,
  controlled,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  initial?: Partial<RecurringRule>;
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
              <Plus className="h-4 w-4" /> New recurring
              <span className="ml-1.5 rounded border border-current/20 bg-current/10 px-1.5 tracking-widest text-sm">⌘I</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Edit recurring rule" : "New recurring rule"}
          </DialogTitle>
        </DialogHeader>
        <RecurringForm initial={initial} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
