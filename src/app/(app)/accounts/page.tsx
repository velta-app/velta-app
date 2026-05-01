"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Archive,
  MoreVertical,
  Pencil,
  GripVertical,
} from "lucide-react";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
import { EntityIcon } from "@/components/shared/entity-icon";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { useAccounts } from "@/hooks/use-accounts";
import { useSession } from "@/hooks/use-session";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { Account } from "@/types";

const TYPE_CONFIG = {
  regular: { label: "Regular", icon: Wallet },
  debt: { label: "Debt", icon: CreditCard },
  savings: { label: "Savings", icon: PiggyBank },
} as const;

type AccountTypeKey = keyof typeof TYPE_CONFIG;

export default function AccountsPage() {
  const { accounts, loading } = useAccounts();
  const { profile } = useSession();
  const supabase = React.useMemo(() => createClient(), []);

  const totalIncluded = accounts
    .filter((a) => a.include_in_total && a.type !== "debt")
    .reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

  const groups: Record<AccountTypeKey, Account[]> = {
    regular: [],
    debt: [],
    savings: [],
  };
  accounts.forEach((a) => groups[a.type].push(a));

  async function archive(id: string) {
    const { error } = await supabase
      .from("accounts")
      .update({ is_archived: true })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Account archived");
      emitMutation("accounts");
    }
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        description={`Net balance: ${formatCurrency(totalIncluded, profile?.default_currency ?? "MXN")}`}
        actions={<AccountDialog />}
      />

      <PageSection className="space-y-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No accounts yet"
            description="Create your first account to start tracking"
            action={<AccountDialog />}
          />
        ) : (
          (Object.keys(groups) as AccountTypeKey[]).map((type) => {
            const list = groups[type];
            if (list.length === 0) return null;
            const config = TYPE_CONFIG[type];
            const Icon = config.icon;

            return (
              <section key={type}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {config.label}
                  </h2>
                </div>
                <SortableAccountGroup
                  type={type}
                  initialList={list}
                  onArchive={archive}
                />
              </section>
            );
          })
        )}
      </PageSection>
    </div>
  );
}

function SortableAccountGroup({
  type,
  initialList,
  onArchive,
}: {
  type: AccountTypeKey;
  initialList: Account[];
  onArchive: (id: string) => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [items, setItems] = React.useState(initialList);

  React.useEffect(() => {
    setItems(initialList);
  }, [initialList]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);

    const updates = next.map((a, idx) =>
      supabase.from("accounts").update({ sort_order: idx }).eq("id", a.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) toast.error("Failed to reorder");
    else emitMutation("accounts");
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <SortableAccountCard
              key={a.id}
              account={a}
              onArchive={onArchive}
              disabled={items.length < 2}
            />
          ))}
        </div>
        <span className="sr-only" aria-hidden>
          {type}
        </span>
      </SortableContext>
    </DndContext>
  );
}

function SortableAccountCard({
  account,
  onArchive,
  disabled,
}: {
  account: Account;
  onArchive: (id: string) => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "z-10 opacity-70"
      )}
    >
      <AccountCard account={account} onArchive={onArchive} />
      {!disabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1 z-10 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function AccountCard({
  account,
  onArchive,
}: {
  account: Account;
  onArchive: (id: string) => void;
}) {
  const balance = Number(account.balance ?? 0);
  const creditLimit = account.credit_limit ? Number(account.credit_limit) : null;
  const goalAmount = account.goal_amount ? Number(account.goal_amount) : null;

  const isCreditRegular = account.type === "regular" && creditLimit != null;
  const hasGoal = account.type === "savings" && goalAmount != null && goalAmount > 0;

  let headline = balance;
  let headlineIntent: "neutral" | "expense" = "neutral";
  let sub: React.ReactNode = null;
  let utilizationBar: number | null = null;

  if (account.type === "debt") {
    headline = Number(account.total_debt ?? account.balance ?? 0);
    headlineIntent = "expense";
    if (account.owed_to_me != null && Number(account.owed_to_me) > 0) {
      sub = (
        <span>
          I am owed{" "}
          {formatCurrency(Number(account.owed_to_me), account.currency)}
        </span>
      );
    } else if (account.description) {
      sub = account.description;
    }
  } else if (isCreditRegular) {
    headline = -Math.abs(balance);
    headlineIntent = "expense";
    const remaining = (creditLimit as number) - Math.abs(balance);
    utilizationBar = Math.min(100, Math.max(0, (Math.abs(balance) / (creditLimit as number)) * 100));
    sub = (
      <span>
        {formatCurrency(remaining, account.currency)} remaining ·{" "}
        {formatCurrency(creditLimit as number, account.currency)} limit
      </span>
    );
  } else if (account.type === "savings") {
    headline = balance;
    headlineIntent = "neutral";
    if (hasGoal) {
      const remaining = Math.max(0, (goalAmount as number) - balance);
      sub = (
        <span>
          {formatCurrency(remaining, account.currency)} to{" "}
          {formatCurrency(goalAmount as number, account.currency)} goal
        </span>
      );
    } else if (account.description) {
      sub = account.description;
    }
  } else {
    sub = account.description ?? null;
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <EntityIcon
              icon={account.icon}
              color={account.color}
              fallback="account"
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{account.name}</p>
              <p className="text-xs text-muted-foreground">
                {account.currency}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasGoal && (
              <GoalRing
                value={balance}
                goal={goalAmount as number}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Options">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AccountDialog
                  initial={account}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem
                  onClick={() => onArchive(account.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="h-4 w-4" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-5">
          <Amount
            value={headline}
            currency={account.currency}
            intent={headlineIntent}
            className="text-2xl"
          />
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>

        {utilizationBar !== null && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                utilizationBar > 90
                  ? "bg-destructive"
                  : utilizationBar > 75
                  ? "bg-amber-500"
                  : "bg-primary"
              )}
              style={{ width: `${utilizationBar}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GoalRing({ value, goal }: { value: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.max(0, (value / goal) * 100)) : 0;
  const color =
    pct > 66.66
      ? "text-apple-700 dark:text-apple-400"
      : pct > 33.33
      ? "text-amber-500"
      : "text-destructive";
  const strokeColor =
    pct > 66.66
      ? "stroke-apple-600 dark:stroke-apple-500"
      : pct > 33.33
      ? "stroke-amber-500"
      : "stroke-destructive";
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - pct / 100);

  return (
    <div
      className="relative inline-flex h-10 w-10 items-center justify-center"
      aria-label={`Goal progress ${Math.round(pct)}`}
      role="img"
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          className={cn("transition-[stroke-dashoffset]", strokeColor)}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </svg>
      <span className={cn("text-[10px] font-semibold tabular-nums", color)}>
        {Math.round(pct)}
      </span>
    </div>
  );
}
