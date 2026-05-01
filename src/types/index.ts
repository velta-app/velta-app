import type { Tables } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;
export type Account = Tables<"accounts">;
export type Category = Tables<"categories">;
export type Transaction = Tables<"transactions">;
export type Budget = Tables<"budgets">;
export type BudgetProgress = Tables<"budget_progress">;
export type RecurringRule = Tables<"recurring_rules">;
export type MonthlySummary = Tables<"monthly_summary">;
export type ExchangeRate = Tables<"exchange_rates">;

export type TransactionWithRelations = Transaction & {
  category: Pick<
    Category,
    "id" | "name" | "icon" | "color" | "type" | "parent_id"
  > | null;
  from_account: Pick<
    Account,
    "id" | "name" | "icon" | "color" | "currency"
  > | null;
  to_account: Pick<
    Account,
    "id" | "name" | "icon" | "color" | "currency"
  > | null;
};

export type CategoryWithChildren = Category & {
  children: Category[];
};
