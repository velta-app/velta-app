import { cn, formatCurrency, type Currency } from "@/lib/utils";

interface AmountProps {
  value: number | string | null | undefined;
  currency?: Currency;
  signed?: boolean;
  compact?: boolean;
  intent?: "neutral" | "income" | "expense" | "transfer";
  className?: string;
}

export function Amount({
  value,
  currency = "MXN",
  signed,
  compact,
  intent = "neutral",
  className,
}: AmountProps) {
  const text = formatCurrency(value, currency, { signed, compact });
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        intent === "income" && "text-apple-700 dark:text-apple-400",
        intent === "expense" && "text-destructive",
        intent === "transfer" && "text-muted-foreground",
        className
      )}
    >
      {text}
    </span>
  );
}
