"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  getQuarter,
  getYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type Period = "day" | "week" | "month" | "quarter" | "year" | "all";

export interface PeriodRange {
  from: Date;
  to: Date;
  label: string;
}

const DATA_START = new Date(2018, 0, 1);

/** Returns the range for the CURRENT period (offset = 0). */
export function periodRange(period: Period): PeriodRange {
  return navigatedPeriodRange(period, 0);
}

/** Returns the range for period + offset steps back (negative = past). */
export function navigatedPeriodRange(period: Period, offset: number): PeriodRange {
  const now = new Date();

  switch (period) {
    case "day": {
      const d = addDays(now, offset);
      return {
        from: startOfDay(d),
        to: endOfDay(d),
        label:
          offset === 0
            ? "Today"
            : offset === -1
            ? "Yesterday"
            : format(d, "MMM d, yyyy"),
      };
    }
    case "week": {
      const ws = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), offset);
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      return {
        from: ws,
        to: we,
        label:
          offset === 0
            ? "This week"
            : `${format(ws, "MMM d")}–${format(we, "MMM d, yyyy")}`,
      };
    }
    case "quarter": {
      const base = addQuarters(startOfQuarter(now), offset);
      const q = getQuarter(base);
      const y = getYear(base);
      return {
        from: startOfQuarter(base),
        to: endOfQuarter(base),
        label: `Q${q} ${y}`,
      };
    }
    case "year": {
      const base = addYears(startOfYear(now), offset);
      const y = getYear(base);
      return {
        from: startOfYear(base),
        to: endOfYear(base),
        label: `${y}`,
      };
    }
    case "all":
      return {
        from: DATA_START,
        to: endOfDay(now),
        label: "All time",
      };
    default: {
      // month
      const base = addMonths(startOfMonth(now), offset);
      return {
        from: startOfMonth(base),
        to: endOfMonth(base),
        label: format(base, "MMMM yyyy"),
      };
    }
  }
}

function isAtStart(period: Period, offset: number): boolean {
  if (period === "all") return true;
  const { from } = navigatedPeriodRange(period, offset);
  return from <= DATA_START;
}

function isAtPresent(period: Period, offset: number): boolean {
  return offset >= 0;
}

// ─── PeriodSelector ──────────────────────────────────────────────────────────

const PRIMARY: { value: Period; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

const MORE: { value: Period; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
];

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  className?: string;
}

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  const isMore = MORE.some((m) => m.value === value);
  const moreLabel = MORE.find((m) => m.value === value)?.label;

  return (
    <div className={cn("flex items-center rounded-lg border border-border bg-muted/40 p-0.5", className)}>
      {PRIMARY.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isMore
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isMore ? moreLabel : "More"}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {MORE.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(value === opt.value && "font-medium text-primary")}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── PeriodNavigator ─────────────────────────────────────────────────────────

interface PeriodNavigatorProps {
  period: Period;
  offset: number;
  onOffsetChange: (offset: number) => void;
  className?: string;
}

export function PeriodNavigator({ period, offset, onOffsetChange, className }: PeriodNavigatorProps) {
  if (period === "all") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="min-w-[160px] text-center text-sm font-medium text-muted-foreground">
          Since Jan 2018
        </span>
      </div>
    );
  }

  const { label } = navigatedPeriodRange(period, offset);
  const atStart = isAtStart(period, offset);
  const atPresent = isAtPresent(period, offset);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={atStart}
        onClick={() => onOffsetChange(offset - 1)}
        aria-label="Previous period"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[140px] text-center text-sm font-medium tabular-nums">
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={atPresent}
        onClick={() => onOffsetChange(offset + 1)}
        aria-label="Next period"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
