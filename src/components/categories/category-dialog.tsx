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
import { CategoryForm } from "./category-form";
import type { Category } from "@/types";
import type { CategoryType } from "@/lib/constants";

export function CategoryDialog({
  initial,
  defaultType,
  parentId,
  trigger,
}: {
  initial?: Partial<Category>;
  defaultType?: CategoryType;
  parentId?: string | null;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" /> New
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Edit category" : "New category"}
          </DialogTitle>
        </DialogHeader>
        <CategoryForm
          initial={initial}
          defaultType={defaultType}
          parentId={parentId}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
