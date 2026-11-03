import type { Currency } from "@/lib/utils";

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] =
  [
    { value: "MXN", label: "Mexican Peso", symbol: "MX$" },
    { value: "USD", label: "US Dollar", symbol: "$" },
  ];

/** How often a planned item repeats. `months` = step between occurrences. */
export const FREQUENCIES = [
  { value: "monthly", label: "Monthly", short: "/mo", months: 1 },
  { value: "bimonthly", label: "Every 2 months", short: "/2mo", months: 2 },
  { value: "quarterly", label: "Every 3 months", short: "/3mo", months: 3 },
  { value: "semiannual", label: "Every 6 months", short: "/6mo", months: 6 },
  { value: "annual", label: "Yearly", short: "/yr", months: 12 },
  { value: "one_time", label: "One-time", short: "once", months: 0 },
] as const;

export type Frequency = (typeof FREQUENCIES)[number]["value"];

export function frequencyMeta(f: Frequency) {
  return FREQUENCIES.find((x) => x.value === f) ?? FREQUENCIES[0];
}

export const ITEM_KINDS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
] as const;

export type ItemKind = (typeof ITEM_KINDS)[number]["value"];

export const HORIZONS = [
  { value: 1, label: "1M" },
  { value: 3, label: "3M" },
  { value: 6, label: "6M" },
  { value: 12, label: "12M" },
  { value: 24, label: "24M" },
] as const;

/** Suggested starting split (50 / 30 / 20 rule). */
export const DEFAULT_BUCKETS = [
  { name: "Needs", percent: 50, color: "#3b82f6", icon: "home" },
  { name: "Wishes", percent: 30, color: "#db2777", icon: "sparkles" },
  { name: "Savings", percent: 20, color: "#00a63e", icon: "piggy-bank" },
] as const;

export const NOT_SET_COLOR = "#a1a1aa";
