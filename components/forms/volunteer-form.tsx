"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { VOLUNTEER_INTERESTS } from "@/lib/plug-in";

type FieldErrors = Record<string, string[] | undefined>;

export function VolunteerForm() {
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<FieldErrors>({});
  const [interests, setInterests] = React.useState<string[]>([]);

  function toggle(area: string) {
    setInterests((cur) =>
      cur.includes(area) ? cur.filter((a) => a !== area) : [...cur, area],
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setIssues({});

    const form = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), interests };
    try {
      const res = await fetch("/api/volunteers", {
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
        <h2 className="font-display text-heading font-bold">You&apos;re on the crew.</h2>
        <p className="mt-2 text-muted-foreground">
          Check your inbox for confirmation. The volunteer lead will reach out
          with shifts as the week firms up.
        </p>
      </div>
    );
  }

  const err = (f: string) => issues[f]?.[0];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="v-name">Name</Label>
          <Input id="v-name" name="name" required />
          {err("name") && <FieldError>{err("name")}</FieldError>}
        </div>
        <div>
          <Label htmlFor="v-email">Email</Label>
          <Input id="v-email" name="email" type="email" required />
          {err("email") && <FieldError>{err("email")}</FieldError>}
        </div>
      </div>

      <div>
        <Label htmlFor="v-phone">Phone (optional)</Label>
        <Input id="v-phone" name="phone" type="tel" placeholder="For day-of coordination" />
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-foreground">
          Where do you want to help?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {VOLUNTEER_INTERESTS.map((area) => {
            const on = interests.includes(area);
            return (
              <button
                type="button"
                key={area}
                onClick={() => toggle(area)}
                aria-pressed={on}
                className={cn(
                  "rounded-md border p-3 text-left text-sm font-medium transition-colors",
                  on
                    ? "border-magenta bg-magenta/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50",
                )}
              >
                {area}
              </button>
            );
          })}
        </div>
        {err("interests") && <FieldError>{err("interests")}</FieldError>}
      </fieldset>

      <div>
        <Label htmlFor="v-availability">When can you help?</Label>
        <Input
          id="v-availability"
          name="availability"
          placeholder="e.g. mornings Sept 28–30, all day Oct 1"
          required
        />
        {err("availability") && <FieldError>{err("availability")}</FieldError>}
      </div>

      <div>
        <Label htmlFor="v-notes">Anything else? (optional)</Label>
        <Textarea id="v-notes" name="notes" rows={3} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="sm:w-fit">
        {pending ? "Signing you up…" : "Join the crew"}
      </Button>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
