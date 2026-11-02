import { Suspense } from "react";
import type { Metadata } from "next";
import { Brand } from "@/components/shared/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Brand iconOnly size="lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to Velta
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

    </div>
  );
}
