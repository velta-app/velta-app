"use client";

import { cn } from "@/lib/utils";

/** iOS-style segmented control. */
export function SegmentedControl({
  value,
  onChange,
  options,
  className,
  size = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: React.ReactNode }[];
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md font-medium transition-all",
              size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
