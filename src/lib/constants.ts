import type { Currency } from "@/lib/utils";

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] =
  [
    { value: "MXN", label: "Mexican Peso", symbol: "MX$" },
    { value: "USD", label: "US Dollar", symbol: "$" },
  ];

export const ACCOUNT_TYPES = [
  { value: "regular", label: "Regular", hint: "Debit accounts, cash, etc." },
  { value: "debt", label: "Debt", hint: "Credit cards, loans" },
  { value: "savings", label: "Savings", hint: "Goal-based savings" },
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

export const TRANSACTION_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number]["value"];

export const CATEGORY_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
] as const;

export type CategoryType = (typeof CATEGORY_TYPES)[number]["value"];

export const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "every_2_days", label: "Every 2 days" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "weekly", label: "Weekly" },
  { value: "every_2_weeks", label: "Every 2 weeks" },
  { value: "every_4_weeks", label: "Every 4 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "every_2_months", label: "Every 2 months" },
  { value: "every_3_months", label: "Every 3 months" },
  { value: "every_6_months", label: "Every 6 months" },
  { value: "yearly", label: "Yearly" },
] as const;

export type Frequency = (typeof FREQUENCIES)[number]["value"];

export const BUDGET_PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export type BudgetPeriod = (typeof BUDGET_PERIODS)[number]["value"];
