"use client";

import * as React from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";

const MIN_LENGTH = 8;

/** Change the signed-in user's password after re-checking the current one. */
export function ChangePasswordForm() {
  const supabase = React.useMemo(() => createClient(), []);
  const { user } = useSession();
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setShow(false);
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    if (next.length < MIN_LENGTH) {
      toast.error(`Use at least ${MIN_LENGTH} characters`);
      return;
    }
    if (next !== confirm) {
      toast.error("The new passwords don't match");
      return;
    }
    if (next === current) {
      toast.error("Choose a password different from the current one");
      return;
    }

    setSaving(true);
    // Verify the current password so an unlocked device can't change it.
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (authError) {
      setSaving(false);
      toast.error("Current password is incorrect");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: next,
      current_password: current,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    reset();
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        <KeyRound className="h-4 w-4" /> Change password
      </Button>
    );
  }

  const type = show ? "text" : "password";

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Change password</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide passwords" : "Show passwords"}
        >
          {show ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type={type}
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type={type}
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          At least {MIN_LENGTH} characters.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type={type}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={reset} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Update password
        </Button>
      </div>
    </form>
  );
}
