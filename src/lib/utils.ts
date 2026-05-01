import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Currency = "MXN" | "USD";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: Currency, locale = "en-US") {
  const key = `${locale}-${currency}`;
  let fmt = currencyFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(key, fmt);
  }
  return fmt;
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: Currency = "MXN",
  options: { signed?: boolean; compact?: boolean } = {}
) {
  const n = typeof amount === "string" ? Number(amount) : amount ?? 0;
  if (!Number.isFinite(n)) return "—";

  if (options.compact && Math.abs(n) >= 1000) {
    const formatted = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
    return `${currency === "MXN" ? "MX$" : "$"}${formatted}`;
  }

  const formatted = getFormatter(currency).format(Math.abs(n));
  if (options.signed && n !== 0) {
    return `${n < 0 ? "−" : "+"}${formatted}`;
  }
  return n < 0 ? `−${formatted}` : formatted;
}

export function formatPercent(value: number, fractionDigits = 0) {
  return `${value.toFixed(fractionDigits)}%`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function createChannelName(prefix: string) {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${id}`;
}

export function initials(name?: string | null) {
  if (!name) return "·";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
