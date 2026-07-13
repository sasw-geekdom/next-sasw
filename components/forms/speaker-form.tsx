"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type FieldErrors = Record<string, string[] | undefined>;

export function SpeakerForm() {
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
    try {
      const res = await fetch("/api/speakers", { method: "POST", body: form });
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
        <h2 className="font-display text-heading font-bold">
          You pitched. We got it.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Check your inbox for confirmation. We read every one — you&apos;ll hear
          back as the Circuit lineup takes shape.
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

      <div>
        <Label htmlFor="company">Company / project (optional)</Label>
        <Input id="company" name="company" />
      </div>

      <div>
        <Label htmlFor="sessionTitle">Session title</Label>
        <Input id="sessionTitle" name="sessionTitle" required />
        {err("sessionTitle") && <FieldError>{err("sessionTitle")}</FieldError>}
      </div>

      <div>
        <Label htmlFor="abstract">What&apos;s the session about?</Label>
        <Textarea id="abstract" name="abstract" rows={5} required />
        {err("abstract") && <FieldError>{err("abstract")}</FieldError>}
      </div>

      <div>
        <Label htmlFor="bio">Short bio</Label>
        <Textarea id="bio" name="bio" rows={3} required />
        {err("bio") && <FieldError>{err("bio")}</FieldError>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="website">Website (optional)</Label>
          <Input id="website" name="website" type="url" placeholder="https://" />
          {err("website") && <FieldError>{err("website")}</FieldError>}
        </div>
        <div>
          <Label htmlFor="linkedin">LinkedIn (optional)</Label>
          <Input id="linkedin" name="linkedin" type="url" placeholder="https://" />
          {err("linkedin") && <FieldError>{err("linkedin")}</FieldError>}
        </div>
      </div>

      <div>
        <Label htmlFor="availability">Availability (optional)</Label>
        <Input
          id="availability"
          name="availability"
          placeholder="e.g. any day except Tuesday morning"
        />
      </div>

      <div>
        <Label htmlFor="headshot">Headshot (optional — JPEG/PNG/WebP, 5 MB max)</Label>
        <Input
          id="headshot"
          name="headshot"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="pt-2.5"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="sm:w-fit">
        {pending ? "Sending…" : "Pitch your session"}
      </Button>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
