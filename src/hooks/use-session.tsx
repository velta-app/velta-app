"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface SessionValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = React.createContext<SessionValue | undefined>(undefined);

export function SessionProvider({
  initialUser,
  initialProfile,
  children,
}: {
  initialUser: User | null;
  initialProfile: Profile | null;
  children: React.ReactNode;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = React.useState<User | null>(initialUser);
  const [profile, setProfile] = React.useState<Profile | null>(initialProfile);
  const [loading, setLoading] = React.useState(false);

  const loadProfile = React.useCallback(
    async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      setProfile(data);
    },
    [supabase]
  );

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) await loadProfile(data.user.id);
    else setProfile(null);
    setLoading(false);
  }, [supabase, loadProfile]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  }, [supabase]);

  React.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const value = React.useMemo(
    () => ({ user, profile, loading, refresh, signOut }),
    [user, profile, loading, refresh, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
