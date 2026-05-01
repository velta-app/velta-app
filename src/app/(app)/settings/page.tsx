"use client";

import * as React from "react";
import { Laptop, LogOut, Moon, Sun, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/hooks/use-session";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";
import type { Currency } from "@/lib/utils";

export default function SettingsPage() {
  const { user, profile, refresh, signOut } = useSession();
  const supabase = React.useMemo(() => createClient(), []);
  const { theme, setTheme } = useTheme();

  const [firstName, setFirstName] = React.useState(profile?.first_name ?? "");
  const [lastName, setLastName] = React.useState(profile?.last_name ?? "");
  const [currency, setCurrency] = React.useState<Currency>(
    (profile?.default_currency ?? "MXN") as Currency
  );
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setFirstName(profile?.first_name ?? "");
    setLastName(profile?.last_name ?? "");
    setCurrency((profile?.default_currency ?? "MXN") as Currency);
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName || null,
        default_currency: currency,
        avatar_url: avatarUrl || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    refresh();
  }

  return (
    <div>
      <PageHeader title="Settings" description="Account & preferences" />

      <PageSection className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>
                    {initials(`${firstName} ${lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Default currency</Label>
                <Select
                  value={currency}
                  onValueChange={(v) => setCurrency(v as Currency)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
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
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-colors",
                        active
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
            <CardContent className="space-y-3">
              <div className="rounded-md border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Signed in as
                </p>
                <p className="mt-1 text-sm font-medium break-all">
                  {user?.email ?? "—"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm">Velta</p>
              <p className="text-xs text-muted-foreground">
                Personal finance, designed for clarity.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Version 0.1.0</p>
            </CardContent>
          </Card>
        </div>
      </PageSection>
    </div>
  );
}
