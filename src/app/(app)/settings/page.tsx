"use client";

import * as React from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { Laptop, Loader2, LogOut, Moon, RefreshCw, Share, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { HorizonPicker } from "@/components/budget/horizon-picker";
import { useSession } from "@/hooks/use-session";
import { useUpdateProfile } from "@/hooks/use-budget";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, profile, signOut } = useSession();
  const update = useUpdateProfile();
  const { theme, setTheme } = useTheme();

  const [rate, setRate] = React.useState(String(profile?.usd_mxn_rate ?? ""));
  const [buffer, setBuffer] = React.useState(String(profile?.safety_buffer ?? 0));
  const [name, setName] = React.useState(profile?.first_name ?? "");
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from server
    setRate(String(profile?.usd_mxn_rate ?? ""));
    setBuffer(String(profile?.safety_buffer ?? 0));
    setName(profile?.first_name ?? "");
  }, [profile?.usd_mxn_rate, profile?.safety_buffer, profile?.first_name]);

  async function save(patch: Parameters<typeof update>[0], message = "Saved") {
    const { error } = await update(patch);
    if (error) toast.error(error.message);
    else toast.success(message);
  }

  async function refreshRate() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/fx", { cache: "no-store" });
      const json = (await res.json()) as { rate?: number };
      if (!json.rate) throw new Error("Rate unavailable right now");
      await save(
        { usd_mxn_rate: json.rate, fx_updated_at: new Date().toISOString(), fx_auto: true },
        `1 USD = ${json.rate.toFixed(4)} MXN`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fetch rate");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Settings" className="hidden md:flex" />
      <PageSection className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>How Velta calculates your split and warnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Row label="Display currency" hint="Everything converts to this">
              <CurrencyToggle />
            </Row>
            <div className="space-y-2">
              <Label>Look ahead</Label>
              <HorizonPicker />
            </div>
            <Row
              label="Count expected income"
              hint="Add income planned inside the horizon to the money you split"
            >
              <Switch
                checked={profile?.include_income ?? true}
                onCheckedChange={(v) => save({ include_income: v })}
              />
            </Row>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                save({ safety_buffer: Number(buffer) || 0 });
              }}
            >
              <Label htmlFor="buffer">Safety cushion ({profile?.default_currency ?? "MXN"})</Label>
              <div className="flex gap-2">
                <Input
                  id="buffer"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={buffer}
                  onChange={(e) => setBuffer(e.target.value)}
                />
                <Button type="submit" variant="outline">Save</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Warn me when the projected balance drops below this.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exchange rate</CardTitle>
            <CardDescription suppressHydrationWarning>
              {profile?.fx_updated_at
                ? `Updated ${formatDistanceToNowStrict(parseISO(profile.fx_updated_at), { addSuffix: true })}`
                : "Used to combine MXN and USD"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const r = Number(rate);
                if (!(r > 0)) return toast.error("Enter a valid rate");
                save({ usd_mxn_rate: r, fx_auto: false, fx_updated_at: new Date().toISOString() });
              }}
            >
              <Label htmlFor="rate">1 USD in MXN</Label>
              <div className="flex gap-2">
                <Input
                  id="rate"
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  min="0"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="tabular-nums"
                />
                <Button type="submit" variant="outline">Set</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 md:h-10 md:w-10"
                  onClick={refreshRate}
                  disabled={refreshing}
                  aria-label="Fetch latest rate"
                >
                  {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                </Button>
              </div>
            </form>
            <Row label="Auto-update daily" hint="Setting a rate by hand turns this off">
              <Switch
                checked={profile?.fx_auto ?? true}
                onCheckedChange={(v) => save({ fx_auto: v, fx_updated_at: v ? null : profile?.fx_updated_at })}
              />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Laptop },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-colors",
                      theme === opt.value
                        ? "border-primary bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) save({ first_name: name.trim() });
              }}
            >
              <Label htmlFor="name">Name</Label>
              <div className="flex gap-2">
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                <Button type="submit" variant="outline">Save</Button>
              </div>
            </form>
            <p className="break-all text-xs text-muted-foreground">
              Signed in as {user?.email ?? "—"} · private app, sign-ups disabled
            </p>
            <Button variant="outline" onClick={signOut} className="w-full justify-start">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Share className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Install on iPhone:</span> open
              Velta in Safari, tap Share, then “Add to Home Screen”. It opens full-screen
              like a native app.
            </p>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
