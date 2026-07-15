"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SPONSOR_LEVELS } from "@/lib/plug-in";

type FieldErrors = Record<string, string[] | undefined>;

export function SponsorForm() {
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<FieldErrors>({});
  const [level, setLevel] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setIssues({});

    const form = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), level };
    try {
      const res = await fetch("/api/sponsors", {
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
        <h2 className="font-display text-heading font-bold">Let&apos;s talk.</h2>
        <p className="mt-2 text-muted-foreground">
          Check your inbox for confirmation. Someone from the team will follow up
          to find the right fit.
        </p>
      </div>
    );
  }

  const err = (f: string) => issues[f]?.[0];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-name">Your name</Label>
          <Input id="s-name" name="name" required />
          {err("name") && <FieldError>{err("name")}</FieldError>}
        </div>
        <div>
          <Label htmlFor="s-email">Email</Label>
          <Input id="s-email" name="email" type="email" required />
          {err("email") && <FieldError>{err("email")}</FieldError>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-company">Company</Label>
          <Input id="s-company" name="company" required />
          {err("company") && <FieldError>{err("company")}</FieldError>}
        </div>
        <div>
          <Label htmlFor="s-role">Role</Label>
          <Input id="s-role" name="role" placeholder="Marketing, founder, partnerships…" required />
          {err("role") && <FieldError>{err("role")}</FieldError>}
        </div>
      </div>

      <div>
        <Label htmlFor="s-website">Website (optional)</Label>
        <Input id="s-website" name="website" type="url" placeholder="https://" />
        {err("website") && <FieldError>{err("website")}</FieldError>}
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-foreground">
          What are you thinking?
        </legend>
        <div className="flex flex-wrap gap-2">
          {SPONSOR_LEVELS.map((lvl) => {
            const on = level === lvl;
            return (
              <button
                type="button"
                key={lvl}
                onClick={() => setLevel(lvl)}
                aria-pressed={on}
                className={cn(
                  "rounded-md border px-4 py-2.5 text-sm font-medium transition-colors",
                  on
                    ? "border-magenta bg-magenta/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50",
                )}
              >
                {lvl}
              </button>
            );
          })}
        </div>
        {err("level") && <FieldError>{err("level")}</FieldError>}
      </fieldset>

      <div>
        <Label htmlFor="s-message">Tell us more (optional)</Label>
        <Textarea
          id="s-message"
          name="message"
          rows={4}
          placeholder="Goals, audience you want to reach, anything specific…"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="sm:w-fit">
        {pending ? "Sending…" : "Start the conversation"}
      </Button>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
