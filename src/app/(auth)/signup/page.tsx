import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Brand iconOnly size="lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start tracking your finances with clarity
          </p>
        </div>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
