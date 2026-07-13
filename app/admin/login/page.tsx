import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          SASTW Admin
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-none text-foreground">
          Plug in.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Geekdom staff only. Sign in with your workspace account.
        </p>

        <div className="mt-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
