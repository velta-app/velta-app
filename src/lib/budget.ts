/**
 * Pure budgeting engine — no React, no Supabase.
 *
 * Model:
 *  - Funds: money you have right now (any currency).
 *  - Buckets: a percentage split of the "money to budget".
 *  - Planned items: recurring or one-time expenses / income.
 *
 * "Money to budget" = current funds (+ expected income inside the horizon when
 * `includeIncome` is on). Each bucket gets `percent` of it, and the expenses
 * assigned to that bucket over the horizon are its commitments.
 */
import {
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { frequencyMeta, NOT_SET_COLOR, type Frequency } from "@/lib/constants";
import type { Currency } from "@/lib/utils";
import type { Bucket, Fund, PlannedItem } from "@/types";

export const NOT_SET_ID = "__not_set__";

/** Convert between MXN and USD. `rate` = MXN per 1 USD. */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rate: number
) {
  if (from === to) return amount;
  if (!rate || rate <= 0) return amount;
  return from === "USD" ? amount * rate : amount / rate;
}

/** All occurrence dates of an item in [from, to] (inclusive, day precision). */
export function occurrencesBetween(
  item: Pick<PlannedItem, "frequency" | "start_date" | "end_date" | "is_active">,
  from: Date,
  to: Date
): Date[] {
  if (!item.is_active) return [];
  const start = startOfDay(parseISO(item.start_date));
  const end = item.end_date ? startOfDay(parseISO(item.end_date)) : null;
  const lo = startOfDay(from);
  const hi = startOfDay(to);
  const inRange = (d: Date) =>
    !isBefore(d, lo) && !isAfter(d, hi) && (!end || !isAfter(d, end));

  const step = frequencyMeta(item.frequency as Frequency).months;
  if (step === 0) return inRange(start) ? [start] : [];

  const out: Date[] = [];
  // Jump close to `lo` instead of iterating from the start date.
  let k = Math.max(0, Math.floor(differenceInCalendarMonths(lo, start) / step) - 1);
  // Always compute from the start date to avoid end-of-month drift.
  for (let guard = 0; guard < 600; guard++, k++) {
    const d = addMonths(start, k * step);
    if (isAfter(d, hi) || (end && isAfter(d, end))) break;
    if (inRange(d)) out.push(d);
  }
  return out;
}

/** Next occurrence on/after `from`, or null. */
export function nextOccurrence(item: PlannedItem, from: Date) {
  return occurrencesBetween(item, from, addMonths(from, 25))[0] ?? null;
}

/** Average monthly cost of a recurring item (0 for one-time). */
export function monthlyEquivalent(item: PlannedItem) {
  const step = frequencyMeta(item.frequency as Frequency).months;
  return step === 0 ? 0 : Number(item.amount) / step;
}

export interface Settings {
  displayCurrency: Currency;
  rate: number;
  horizonMonths: number;
  includeIncome: boolean;
  safetyBuffer: number;
  today?: Date;
}

export interface Occurrence {
  item: PlannedItem;
  date: Date;
  /** Amount converted to display currency. */
  amount: number;
  /** True if the date is before today (already happened this month). */
  past: boolean;
}

export interface MonthForecast {
  key: string;
  label: string;
  start: Date;
  end: Date;
  occurrences: Occurrence[];
  expenses: number;
  income: number;
  net: number;
  /** Projected money at the end of the month. */
  endBalance: number;
}

export interface BucketStat {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  percent: number;
  allocated: number;
  committed: number;
  remaining: number;
  /** committed / allocated, 0..∞ */
  usage: number;
  /** Average monthly spend of recurring items in this bucket. */
  monthly: number;
  itemCount: number;
  status: "ok" | "warning" | "over" | "empty";
}

export type WarningLevel = "danger" | "warning" | "info";
export interface BudgetWarning {
  id: string;
  level: WarningLevel;
  title: string;
  detail?: string;
  href?: string;
}

export interface BudgetSummary {
  totalFunds: number;
  expectedIncome: number;
  base: number;
  allocatedPercent: number;
  committed: number;
  monthlyRecurring: number;
  buckets: BucketStat[];
  months: MonthForecast[];
  upcoming: Occurrence[];
  warnings: BudgetWarning[];
  status: "on_track" | "at_risk" | "over";
  horizonEnd: Date;
}

const WARN_USAGE = 0.85;

export function computeBudget(
  funds: Fund[],
  buckets: Bucket[],
  items: PlannedItem[],
  s: Settings
): BudgetSummary {
  const today = startOfDay(s.today ?? new Date());
  const cur = s.displayCurrency;
  const conv = (amount: number, from: Currency) =>
    convert(Number(amount), from, cur, s.rate);

  const horizon = Math.max(1, s.horizonMonths);
  const horizonEnd = endOfMonth(addMonths(today, horizon - 1));

  const totalFunds = funds.reduce(
    (sum, f) => sum + conv(Number(f.amount), f.currency as Currency),
    0
  );

  // Month-by-month forecast (current month included, past days shown greyed).
  const months: MonthForecast[] = [];
  let balance = totalFunds;
  for (let i = 0; i < horizon; i++) {
    const start = startOfMonth(addMonths(today, i));
    const end = endOfMonth(start);
    const occurrences: Occurrence[] = [];
    for (const item of items) {
      for (const date of occurrencesBetween(item, start, end)) {
        occurrences.push({
          item,
          date,
          amount: conv(Number(item.amount), item.currency as Currency),
          past: isBefore(date, today),
        });
      }
    }
    occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
    const future = occurrences.filter((o) => !o.past);
    const expenses = sumBy(future.filter((o) => o.item.kind === "expense"));
    const income = sumBy(future.filter((o) => o.item.kind === "income"));
    balance += income - expenses;
    months.push({
      key: format(start, "yyyy-MM"),
      label: format(start, "MMMM yyyy"),
      start,
      end,
      occurrences,
      expenses,
      income,
      net: income - expenses,
      endBalance: balance,
    });
  }

  const futureOcc = months.flatMap((m) => m.occurrences.filter((o) => !o.past));
  const expenseOcc = futureOcc.filter((o) => o.item.kind === "expense");
  const expectedIncome = sumBy(futureOcc.filter((o) => o.item.kind === "income"));
  const base = totalFunds + (s.includeIncome ? expectedIncome : 0);
  const committed = sumBy(expenseOcc);

  const monthlyRecurring = items
    .filter((i) => i.is_active && i.kind === "expense")
    .reduce(
      (sum, i) => sum + conv(monthlyEquivalent(i), i.currency as Currency),
      0
    );

  // Buckets
  const bucketIds = new Set(buckets.map((b) => b.id));
  const statFor = (
    id: string,
    name: string,
    color: string,
    icon: string | null,
    percent: number
  ): BucketStat => {
    const belongs = (i: PlannedItem) =>
      id === NOT_SET_ID
        ? !i.bucket_id || !bucketIds.has(i.bucket_id)
        : i.bucket_id === id;
    const occ = expenseOcc.filter((o) => belongs(o.item));
    const bucketItems = items.filter(
      (i) => i.is_active && i.kind === "expense" && belongs(i)
    );
    const allocated = (base * percent) / 100;
    const c = sumBy(occ);
    const usage = allocated > 0 ? c / allocated : c > 0 ? Infinity : 0;
    return {
      id,
      name,
      color,
      icon,
      percent,
      allocated,
      committed: c,
      remaining: allocated - c,
      usage,
      monthly: bucketItems.reduce(
        (sum, i) => sum + conv(monthlyEquivalent(i), i.currency as Currency),
        0
      ),
      itemCount: bucketItems.length,
      status:
        c === 0 && allocated === 0
          ? "empty"
          : usage > 1
            ? "over"
            : usage >= WARN_USAGE
              ? "warning"
              : "ok",
    };
  };

  const sorted = [...buckets].sort((a, b) => a.sort_order - b.sort_order);
  const bucketStats = sorted.map((b) =>
    statFor(b.id, b.name, b.color, b.icon, Number(b.percent))
  );
  const allocatedPercent = bucketStats.reduce((s2, b) => s2 + b.percent, 0);
  const notSet = statFor(
    NOT_SET_ID,
    "Not set",
    NOT_SET_COLOR,
    null,
    Math.max(0, 100 - allocatedPercent)
  );
  if (notSet.percent > 0 || notSet.committed > 0) bucketStats.push(notSet);

  const upcoming = futureOcc
    .filter((o) => differenceInCalendarDays(o.date, today) <= 45)
    .slice(0, 12);

  const warnings = buildWarnings({
    s,
    cur,
    today,
    totalFunds,
    base,
    allocatedPercent,
    bucketStats,
    months,
    futureOcc,
    funds,
    items,
  });

  const status = warnings.some((w) => w.level === "danger")
    ? "over"
    : warnings.some((w) => w.level === "warning")
      ? "at_risk"
      : "on_track";

  return {
    totalFunds,
    expectedIncome,
    base,
    allocatedPercent,
    committed,
    monthlyRecurring,
    buckets: bucketStats,
    months,
    upcoming,
    warnings,
    status,
    horizonEnd,
  };
}

function sumBy(occ: Occurrence[]) {
  return occ.reduce((s, o) => s + o.amount, 0);
}

function money(n: number, cur: Currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  }).format(n);
}

function buildWarnings(ctx: {
  s: Settings;
  cur: Currency;
  today: Date;
  totalFunds: number;
  base: number;
  allocatedPercent: number;
  bucketStats: BucketStat[];
  months: MonthForecast[];
  futureOcc: Occurrence[];
  funds: Fund[];
  items: PlannedItem[];
}): BudgetWarning[] {
  const { s, cur, today, months } = ctx;
  const w: BudgetWarning[] = [];
  const h = `${s.horizonMonths} month${s.horizonMonths === 1 ? "" : "s"}`;

  if (ctx.funds.length === 0) {
    w.push({
      id: "no-funds",
      level: "info",
      title: "Add the money you have",
      detail: "Your budget is split from your current balance.",
      href: "/money",
    });
  }

  if (ctx.allocatedPercent > 100.001) {
    w.push({
      id: "split-over",
      level: "danger",
      title: `Your split adds up to ${round(ctx.allocatedPercent)}%`,
      detail: "Lower some categories so the total is 100% or less.",
    });
  }

  // Running out of money
  const negative = months.find((m) => m.endBalance < 0);
  if (negative) {
    w.push({
      id: "runs-out",
      level: "danger",
      title: `Money runs out in ${format(negative.start, "MMMM yyyy")}`,
      detail: `Projected balance: ${money(negative.endBalance, cur)}. Planned expenses exceed what you have${s.includeIncome ? " plus expected income" : ""}.`,
      href: "/forecast",
    });
  } else if (s.safetyBuffer > 0) {
    const low = months.find((m) => m.endBalance < s.safetyBuffer);
    if (low) {
      w.push({
        id: "below-buffer",
        level: "warning",
        title: `Below your safety cushion in ${format(low.start, "MMMM")}`,
        detail: `Projected ${money(low.endBalance, cur)} vs. cushion ${money(s.safetyBuffer, cur)}.`,
        href: "/forecast",
      });
    }
  }

  // Buckets
  for (const b of ctx.bucketStats) {
    if (b.id === NOT_SET_ID) continue;
    if (b.status === "over") {
      w.push({
        id: `bucket-over-${b.id}`,
        level: "danger",
        title: `${b.name} is over budget by ${money(-b.remaining, cur)}`,
        detail: `${money(b.committed, cur)} planned in the next ${h} vs. ${money(b.allocated, cur)} allocated (${round(b.percent)}%).`,
      });
    } else if (b.status === "warning") {
      w.push({
        id: `bucket-warn-${b.id}`,
        level: "warning",
        title: `${b.name} is at ${round(b.usage * 100)}% of its budget`,
        detail: `Only ${money(b.remaining, cur)} left for the next ${h}.`,
      });
    }
  }

  const notSet = ctx.bucketStats.find((b) => b.id === NOT_SET_ID);
  if (notSet && notSet.committed > 0) {
    w.push({
      id: "unassigned",
      level: notSet.committed > notSet.allocated ? "warning" : "info",
      title: `${notSet.itemCount} expense${notSet.itemCount === 1 ? " has" : "s have"} no category`,
      detail: `${money(notSet.committed, cur)} planned without a budget category.`,
      href: "/expenses",
    });
  }

  // Months where spending beats income (only meaningful with income items)
  const hasIncome = ctx.items.some((i) => i.is_active && i.kind === "income");
  if (hasIncome) {
    const deficit = months.filter((m) => m.expenses > m.income);
    if (deficit.length > 0) {
      const worst = deficit.reduce((a, b) => (b.net < a.net ? b : a));
      w.push({
        id: "deficit",
        level: "warning",
        title:
          deficit.length === 1
            ? `${format(worst.start, "MMMM")} spending exceeds income`
            : `${deficit.length} months spend more than you earn`,
        detail: `Worst: ${format(worst.start, "MMM yyyy")} at ${money(worst.net, cur)}.`,
        href: "/forecast",
      });
    }
  }

  // Big upcoming hits
  if (ctx.totalFunds > 0) {
    // Irregular hits only (monthly bills are routine), first occurrence per item.
    const seen = new Set<string>();
    const big = ctx.futureOcc.filter((o) => {
      if (
        o.item.kind !== "expense" ||
        o.item.frequency === "monthly" ||
        seen.has(o.item.id) ||
        differenceInCalendarDays(o.date, today) > 60 ||
        o.amount < ctx.totalFunds * 0.1
      )
        return false;
      seen.add(o.item.id);
      return true;
    });
    for (const o of big.slice(0, 3)) {
      const days = differenceInCalendarDays(o.date, today);
      w.push({
        id: `big-${o.item.id}-${o.date.getTime()}`,
        level: "info",
        title: `${o.item.name}: ${money(o.amount, cur)} ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}`,
        detail: `${round((o.amount / ctx.totalFunds) * 100)}% of your money · ${format(o.date, "EEE, MMM d")}`,
      });
    }
  }

  // Stale balances
  if (ctx.funds.length > 0) {
    const last = ctx.funds
      .map((f) => parseISO(f.updated_at))
      .reduce((a, b) => (isAfter(b, a) ? b : a));
    const days = differenceInCalendarDays(today, last);
    if (days >= 21) {
      w.push({
        id: "stale-funds",
        level: "info",
        title: `Balances last updated ${days} days ago`,
        detail: "Refresh them so the split reflects what you really have.",
        href: "/money",
      });
    }
  }

  const order: Record<WarningLevel, number> = { danger: 0, warning: 1, info: 2 };
  return w.sort((a, b) => order[a.level] - order[b.level]);
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
