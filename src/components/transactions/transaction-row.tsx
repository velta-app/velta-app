"use client";

import * as React from "react";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Amount } from "@/components/shared/amount";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AddTransactionDialog } from "./add-transaction-dialog";
import { useCategories } from "@/hooks/use-categories";
import { getVendorLogoUrl } from "@/lib/vendor-logo";
import { cn } from "@/lib/utils";
import type { TransactionWithRelations } from "@/types";
import Image from "next/image";

const typeIcons = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
} as const;

/** Renders a vendor logo with fallback to EntityIcon. */
function VendorAvatar({
  logoUrl,
  icon,
  color,
  fallback,
}: {
  logoUrl: string | null;
  icon: string | null;
  color: string | null;
  fallback: "account" | "category";
}) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  if (logoUrl && !failed) {
    return (
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
        <Image
          width={40}
          height={40}
          src={logoUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return <EntityIcon icon={icon} color={color} fallback={fallback} size="md" />;
}

/** Small category chip shown on the right side. */
function CategoryChip({
  icon,
  color,
  name,
}: {
  icon: string | null;
  color: string | null;
  name: string;
}) {
  return (
    <span className="hidden items-center gap-1 rounded-full border border-border bg-muted/60 py-0.5 pl-1 pr-2 text-[11px] font-medium text-muted-foreground sm:flex">
      <EntityIcon icon={icon} color={color} fallback="category" size="xs" />
      <span className="max-w-[90px] truncate">{name}</span>
    </span>
  );
}

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

  const logoUrl =
    t.type !== "transfer" && t.description
      ? getVendorLogoUrl(t.description)
      : null;

  const primaryText =
    t.description ||
    (t.type === "transfer"
      ? `${t.from_account?.name ?? "—"} → ${t.to_account?.name ?? "—"}`
      : t.category?.name ?? "Uncategorized");

  const secondaryText =
    t.type === "transfer"
      ? `${t.from_account?.name ?? "—"} → ${t.to_account?.name ?? "—"}${t.note ? ` · ${t.note}` : ""}`
      : `${t.from_account?.name ?? t.to_account?.name ?? "—"}${t.note ? ` · ${t.note}` : ""}`;

  // For the category chip: prefer the leaf category name, shown under the parent if present
  const chipCategory = parentCategory ?? t.category ?? null;
  const chipName =
    parentCategory && t.category ? t.category.name : (chipCategory?.name ?? "");

  return (
    <AddTransactionDialog
      initial={t}
      trigger={
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
        >
          <VendorAvatar
            logoUrl={logoUrl}
            icon={iconEntity.icon}
            color={iconEntity.color}
            fallback={iconEntity.fallback}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{primaryText}</p>
            <p className="truncate text-xs text-muted-foreground">{secondaryText}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {t.type !== "transfer" && chipCategory && (
              <CategoryChip
                icon={chipCategory.icon}
                color={chipCategory.color}
                name={chipName}
              />
            )}
            <Amount
              value={t.amount}
              currency={t.currency}
              intent={t.type}
              signed={t.type !== "transfer"}
              className="text-sm tabular-nums"
            />
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                t.type === "income" &&
                  "bg-apple-100 text-apple-800 dark:bg-apple-950 dark:text-apple-300",
                t.type === "expense" &&
                  "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
                t.type === "transfer" && "bg-muted text-muted-foreground"
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
