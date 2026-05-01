"use client";

import * as React from "react";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Amount } from "@/components/shared/amount";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AddTransactionDialog } from "./add-transaction-dialog";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import type { TransactionWithRelations } from "@/types";

const typeIcons = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
} as const;

export function TransactionRow({ t }: { t: TransactionWithRelations }) {
  const { categories } = useCategories();
  const TypeIcon = typeIcons[t.type];

  const parentCategory = t.category?.parent_id
    ? categories.find((c) => c.id === t.category?.parent_id) ?? null
    : null;

  const iconEntity =
    t.type === "transfer"
      ? {
          icon: t.to_account?.icon ?? t.from_account?.icon ?? null,
          color: t.to_account?.color ?? t.from_account?.color ?? null,
          fallback: "account" as const,
        }
      : {
          icon: parentCategory?.icon ?? t.category?.icon ?? null,
          color: parentCategory?.color ?? t.category?.color ?? null,
          fallback: "category" as const,
        };

  const title =
    t.type === "transfer"
      ? `${t.from_account?.name ?? "—"} → ${t.to_account?.name ?? "—"}`
      : parentCategory && t.category
      ? `${parentCategory.name} (${t.category.name})`
      : t.category?.name ?? "Uncategorized";

  const sub =
    t.type === "transfer"
      ? t.note ?? "Transfer"
      : `${t.from_account?.name ?? t.to_account?.name ?? "—"}${
          t.note ? ` · ${t.note}` : ""
        }`;

  return (
    <AddTransactionDialog
      initial={t}
      trigger={
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
          )}
        >
          <EntityIcon
            icon={iconEntity.icon}
            color={iconEntity.color}
            fallback={iconEntity.fallback}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <Amount
              value={t.amount}
              currency={t.currency}
              intent={t.type}
              signed={t.type !== "transfer"}
              className="text-sm"
            />
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                t.type === "income" &&
                  "bg-apple-100 text-apple-800 dark:bg-apple-950 dark:text-apple-300",
                t.type === "expense" &&
                  "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
                t.type === "transfer" &&
                  "bg-muted text-muted-foreground"
              )}
            >
              <TypeIcon className="h-3 w-3" />
            </span>
          </div>
        </button>
      }
    />
  );
}
