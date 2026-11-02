# Velta — private budgeting PWA

Velta splits **the money you have** into budget categories (Needs, Wishes,
Savings, …) and forecasts your **planned expenses** — recurring (monthly,
every 2/3/6 months, yearly) and one-time (a trip) — so you see risks before
they happen. No transaction logging required.

## Screens

| Route | What it does |
|---|---|
| `/` Budget | Donut of the split with % and amount per category, “Not set” remainder, per-category planned vs. allocated, warnings, upcoming payments |
| `/forecast` | Month-by-month spending (stacked by category), income, projected end balance |
| `/expenses` | All planned items, filter by category, monthly average |
| `/money` | Balances (MXN/USD) — location doesn't matter, only totals |
| `/settings` | Display currency, look-ahead horizon, income toggle, safety cushion, USD→MXN rate |

## How the numbers work (`src/lib/budget.ts`)

- **Money to budget** = sum of balances (converted) + expected income inside the
  horizon (toggle in Settings).
- Each category gets `percent` of that. Its **planned** amount is every
  occurrence of its expenses from today to the end of the horizon.
- **Warnings**: split > 100 %, category over / ≥ 85 % used, projected balance
  below 0 or below your cushion, months spending more than income, large
  irregular payments within 60 days, uncategorised expenses, stale balances.
- MXN↔USD use `profiles.usd_mxn_rate`, refreshed daily from `/api/fx`
  (frankfurter.dev, fallback open.er-api.com) unless set by hand.
- Vendor logos come from Google's favicon CDN (`src/lib/vendor-logo.ts`),
  guessed from the name or from an explicit website.

## Stack

Next.js 16 (App Router, `proxy.ts`), React 19, Tailwind v4, shadcn/Radix UI,
Recharts, Supabase (auth + Postgres + realtime), Serwist service worker.

## Database

Migrations live in `supabase/migrations/`. Tables: `funds`, `buckets`,
`planned_items` (+ preference columns on `profiles`), all with RLS.
Sign-ups are blocked by a trigger on `auth.users` except for the allowlisted
email (`enforce_signup_allowlist`). Legacy v1 tables (accounts, transactions,
…) are left in place, unused.

## Develop

```bash
pnpm install
cp .env.example .env.local   # fill Supabase URL + anon/publishable key
pnpm dev
```

## Install on iPhone

Open the deployed URL in Safari → Share → **Add to Home Screen**.
