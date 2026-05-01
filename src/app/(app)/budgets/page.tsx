"use client";

import * as React from "react";
import { MoreVertical, Pencil, PiggyBank, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Amount } from "@/components/shared/amount";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { useBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import { cn } from "@/lib/utils";

export default function BudgetsPage() {
  const { budgets, progress, loading } = useBudgets();
  const { categories } = useCategories();
  const supabase = React.useMemo(() => createClient(), []);

  async function remove(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Budget removed");
      emitMutation("budgets");
    }
  }

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set spending limits to stay on track"
        actions={<BudgetDialog />}
      />
      <PageSection>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No budgets yet"
            description="Create a budget to track spending against a limit"
            action={<BudgetDialog />}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {budgets.map((b) => {
              const p = progress.find((x) => x.budget_id === b.id);
              const cat = categories.find((c) => c.id === b.category_id);
              const spent = Number(p?.spent ?? 0);
              const budgeted = Number(p?.budgeted ?? b.amount);
              const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
              const remaining = budgeted - spent;

              const color =
                pct >= 90
                  ? "bg-destructive"
                  : pct >= 75
                  ? "bg-amber-500"
                  : "bg-primary";

              const textIntent =
                pct >= 90
                  ? "expense"
                  : pct >= 75
                  ? "neutral"
                  : ("income" as const);

              return (
                <Card key={b.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {cat?.name ?? p?.category_name ?? "—"}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {b.period}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Options">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <BudgetDialog
                            initial={b}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem
                            onClick={() => remove(b.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Spent</p>
                        <Amount
                          value={spent}
                          currency={b.currency}
                          className={cn(
                            "text-2xl",
                            pct >= 90 && "text-destructive"
                          )}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <Amount
                          value={budgeted}
                          currency={b.currency}
                          className="text-sm text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <Progress value={Math.min(100, pct)} indicatorClassName={color} />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {pct.toFixed(0)}% used
                        </span>
                        <Amount
                          value={Math.abs(remaining)}
                          currency={b.currency}
                          intent={textIntent}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageSection>
    </div>
  );
}
