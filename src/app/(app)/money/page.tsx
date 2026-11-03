"use client";

import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { Plus, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityIcon } from "@/components/shared/entity-icon";
import { useBudget } from "@/hooks/use-budget";
import { useDialogStore } from "@/lib/dialog-store";
import { convert } from "@/lib/budget";
import { formatCurrency, type Currency } from "@/lib/utils";

export default function MoneyPage() {
  const { funds, summary, currency, rate, loading } = useBudget();
  const openFund = useDialogStore((s) => s.openFund);

  const byCurrency = (["MXN", "USD"] as const)
    .map((c) => ({
      c,
      total: funds
        .filter((f) => f.currency === c)
        .reduce((s, f) => s + Number(f.amount), 0),
      count: funds.filter((f) => f.currency === c).length,
    }))
    .filter((x) => x.count > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Money"
        description="How much you have — location doesn't matter"
        className="hidden md:flex"
        actions={
          <Button onClick={() => openFund()}>
            <Plus /> Add
          </Button>
        }
      />
      <PageSection className="space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="bg-gradient-to-br from-apple-500/10 to-transparent p-5">
            <p className="text-xs font-medium text-muted-foreground">Total you have</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(summary.totalFunds, currency)}
            </p>
            {byCurrency.length > 1 && (
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {byCurrency
                  .map((x) => formatCurrency(x.total, x.c))
                  .join(" + ")}
              </p>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground tabular-nums">
              1 USD = {rate.toFixed(2)} MXN
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <Skeleton className="h-40" />
        ) : funds.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="How much money do you have?"
            description="Add one total, or a few pockets (bank, cash, USD savings). Update them whenever you check your balances."
            action={
              <Button onClick={() => openFund()}>
                <Plus /> Add money
              </Button>
            }
          />
        ) : (
          <Card>
            <CardContent className="divide-y divide-border px-4 py-1">
              {funds.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => openFund(f)}
                  className="flex w-full items-center gap-3 py-3 text-left active:opacity-70"
                >
                  <EntityIcon icon={f.icon} color={f.color} fallback="account" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated{" "}
                      {formatDistanceToNowStrict(parseISO(f.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(f.amount, f.currency as Currency, { cents: Number(f.amount) % 1 !== 0 })}
                    </p>
                    {f.currency !== currency && (
                      <p className="text-[11px] tabular-nums text-muted-foreground">
                        ≈{" "}
                        {formatCurrency(
                          convert(Number(f.amount), f.currency as Currency, currency, rate),
                          currency
                        )}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {funds.length > 0 && (
          <Button variant="outline" className="w-full md:hidden" onClick={() => openFund()}>
            <Plus /> Add money
          </Button>
        )}
      </PageSection>
    </div>
  );
}
