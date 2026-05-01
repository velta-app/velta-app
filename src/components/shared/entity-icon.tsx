"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  getIcon,
  DEFAULT_COLOR,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_ACCOUNT_ICON,
} from "@/lib/icons";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<Size, { box: string; icon: string }> = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4" },
  md: { box: "h-10 w-10", icon: "h-5 w-5" },
  lg: { box: "h-12 w-12", icon: "h-6 w-6" },
  xl: { box: "h-16 w-16", icon: "h-7 w-7" },
};

interface EntityIconProps {
  icon?: string | null;
  color?: string | null;
  fallback?: "account" | "category";
  size?: Size;
  className?: string;
}

export function EntityIcon({
  icon,
  color,
  fallback = "category",
  size = "md",
  className,
}: EntityIconProps) {
  const Icon = getIcon(
    icon ?? (fallback === "account" ? DEFAULT_ACCOUNT_ICON : DEFAULT_CATEGORY_ICON)
  );
  const c = color ?? DEFAULT_COLOR;
  const { box, icon: iconSize } = SIZE_MAP[size];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg",
        box,
        className
      )}
      style={{
        backgroundColor: `${c}1f`,
        color: c,
      }}
    >
      <Icon className={iconSize} strokeWidth={2} />
    </span>
  );
}
