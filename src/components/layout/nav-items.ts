import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Layers,
  PiggyBank,
  Repeat,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Layers },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) =>
  ["/", "/transactions", "/accounts", "/budgets", "/categories"].includes(i.href)
);
