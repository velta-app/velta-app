import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Layers,
  PiggyBank,
  Repeat,
  Settings,
  TrendingUp,
  Download,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cashflow", label: "Cashflow", icon: TrendingUp },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/categories", label: "Categories", icon: Layers },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/import", label: "Import Transactions", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) =>
  ["/", "/cashflow", "/transactions", "/accounts", "/budgets"].includes(i.href)
);
