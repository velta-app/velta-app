"use client";

import { format } from "date-fns";
import { ItemLogo } from "@/components/shared/item-logo";
import { useDialogStore } from "@/lib/dialog-store";
import { frequencyMeta, type Frequency } from "@/lib/constants";
import { cn, formatCurrency, type Currency } from "@/lib/utils";
import type { Bucket, PlannedItem } from "@/types";

/** A planned item row. Tapping it opens the edit sheet. */
export function ItemRow({
  item,
  bucket,
  date,
  displayAmount,
  displayCurrency,
  muted,
  subtitle,
}: {
  item: PlannedItem;
  bucket?: Bucket | null;
  /** Specific occurrence date (forecast views). */
  date?: Date | null;
  /** Converted amount in display currency, shown under the original if different. */
  displayAmount?: number;
  displayCurrency?: Currency;
  muted?: boolean;
  subtitle?: string;
}) {
  const openItem = useDialogStore((s) => s.openItem);
  const freq = frequencyMeta(item.frequency as Frequency);
  const income = item.kind === "income";
  const showConverted =
    displayAmount != null && displayCurrency && displayCurrency !== item.currency;

  return (
    <button
      type="button"
      onClick={() => openItem(item)}
      className={cn(
        "flex w-full items-center gap-3 py-2.5 text-left active:opacity-70",
        (muted || !item.is_active) && "opacity-50"
      )}
    >
      <ItemLogo
        name={item.name}
        domain={item.logo_domain}
        color={bucket?.color}
        icon={income ? "trending-up" : bucket?.icon}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          {bucket && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: bucket.color }}
            />
          )}
          {subtitle ??
            [
              date ? format(date, "EEE, MMM d") : null,
              freq.label,
              bucket?.name ?? (income ? "Income" : "Not set"),
            ]
              .filter(Boolean)
              .join(" · ")}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            income && "text-apple-700 dark:text-apple-400"
          )}
        >
          {income ? "+" : ""}
          {formatCurrency(item.amount, item.currency as Currency, { cents: Number(item.amount) % 1 !== 0 })}
        </p>
        {showConverted ? (
          <p className="text-[11px] tabular-nums text-muted-foreground">
            ≈ {formatCurrency(displayAmount, displayCurrency)}
          </p>
        ) : (
          !date && (
            <p className="text-[11px] text-muted-foreground">{freq.short}</p>
          )
        )}
      </div>
    </button>
  );
}
