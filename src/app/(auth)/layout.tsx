import { Brand } from "@/components/shared/brand";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-apple-500/20 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-[400px] w-[400px] rounded-full bg-apple-700/10 blur-3xl" />
      </div>

      {/* <header className="relative flex items-center justify-between px-6 py-6 md:px-10">
        <Link href="/login" aria-label="Velta home">
          <Brand size="sm" />
        </Link>
      </header> */}

      <main className="relative flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
