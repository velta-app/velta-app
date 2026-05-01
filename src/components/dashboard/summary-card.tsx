import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Amount } from "@/components/shared/amount";
import { cn, type Currency } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: number;
  currency?: Currency;
  icon?: LucideIcon;
  intent?: "neutral" | "income" | "expense";
  hint?: string;
  className?: string;
}

export function SummaryCard({
  label,
  value,
  currency = "MXN",
  icon: Icon,
  intent = "neutral",
  hint,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between p-5 pt-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            <Amount
              value={value}
              currency={currency}
              intent={intent}
              className="text-inherit"
            />
          </div>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              intent === "income" &&
                "bg-apple-100 text-apple-800 dark:bg-apple-950 dark:text-apple-300",
              intent === "expense" &&
                "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
              intent === "neutral" && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
