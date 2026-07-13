"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  type UserCredential,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/admin";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<"google" | "password" | null>(
    null,
  );

  // Trade the Firebase credential for a server-verified session cookie.
  async function establishSession(cred: UserCredential) {
    const idToken = await cred.user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      // Server rejected the account — drop the client session too.
      await auth.signOut();
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Sign-in failed.");
    }

    router.replace(from);
    router.refresh();
  }

  async function onGoogle() {
    setError(null);
    setPending("google");
    try {
      await establishSession(await signInWithPopup(auth, googleProvider));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
      setPending(null);
    }
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending("password");
    try {
      await establishSession(
        await signInWithEmailAndPassword(auth, email, password),
      );
    } catch {
      setError("Wrong email or password.");
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        onClick={onGoogle}
        disabled={pending !== null}
        size="lg"
        className="w-full"
      >
        {pending === "google" ? "Connecting…" : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Superadmin
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onPassword} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="outline"
          disabled={pending !== null}
          className="w-full"
        >
          {pending === "password" ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
