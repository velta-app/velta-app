import { CalendarRange, PieChart, Receipt, Settings, Wallet } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Budget", icon: PieChart, key: "b" },
  { href: "/forecast", label: "Forecast", icon: CalendarRange, key: "f" },
  { href: "/expenses", label: "Expenses", icon: Receipt, key: "e" },
  { href: "/money", label: "Money", icon: Wallet, key: "m" },
  { href: "/settings", label: "Settings", icon: Settings, key: "s" },
] as const;

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) => i.href !== "/settings");

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
