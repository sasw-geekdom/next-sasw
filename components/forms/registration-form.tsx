"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type FieldErrors = Record<string, string[] | undefined>;

export function RegistrationForm() {
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setIssues({});

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIssues(body.issues ?? {});
        setError(body.error ?? "Something went wrong.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-white p-8">
        <h2 className="font-display text-heading font-bold">You&apos;re in.</h2>
        <p className="mt-2 text-muted-foreground">
          Check your inbox — confirmation&apos;s on the way. See you downtown,
          Sept 28 – Oct 2.
        </p>
      </div>
    );
  }

  const err = (f: string) => issues[f]?.[0];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
          {err("name") && <FieldError>{err("name")}</FieldError>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
          {err("email") && <FieldError>{err("email")}</FieldError>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="company">Company / project (optional)</Label>
          <Input id="company" name="company" />
        </div>
        <div>
          <Label htmlFor="role">Role (optional)</Label>
          <Input id="role" name="role" placeholder="Founder, builder, investor…" />
        </div>
      </div>

      <div>
        <Label htmlFor="interest">What brings you? (optional)</Label>
        <Textarea id="interest" name="interest" rows={3} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="sm:w-fit">
        {pending ? "Getting you on the list…" : "Get on the list"}
      </Button>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
