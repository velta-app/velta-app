import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/hooks/use-session";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <SessionProvider initialUser={user} initialProfile={profile ?? null}>
      <AppShell>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
              {children}
            </main>
            <BottomNav />
          </div>
        </div>
      </AppShell>
    </SessionProvider>
  );
}
