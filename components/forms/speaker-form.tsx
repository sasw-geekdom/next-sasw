"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TRACKS, CIRCUIT_COLORS, DEFAULT_CIRCUIT_COLOR } from "@/lib/tracks";
import { useBoltColor } from "@/components/site/bolt-color";

type FieldErrors = Record<string, string[] | undefined>;

export function SpeakerForm() {
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<FieldErrors>({});
  const [track, setTrack] = React.useState("");
  const { setColor } = useBoltColor();

  function selectTrack(name: keyof typeof CIRCUIT_COLORS) {
    setTrack(name);
    setColor(CIRCUIT_COLORS[name] ?? DEFAULT_CIRCUIT_COLOR);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setIssues({});

    const form = new FormData(e.currentTarget);
    form.set("track", track);
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
        <Label htmlFor="company">Company / project</Label>
        <Input id="company" name="company" required />
        {err("company") && <FieldError>{err("company")}</FieldError>}
      </div>

      <fieldset>
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          Five circuits · one current
        </p>
        <legend className="mb-2 mt-1.5 block text-sm font-medium text-foreground">
          Which circuit fits your session? Pick one to light the current.
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TRACKS.map((t) => {
            const selected = track === t.name;
            return (
              <button
                type="button"
                key={t.name}
                onClick={() => selectTrack(t.name)}
                aria-pressed={selected}
                style={selected ? { borderColor: CIRCUIT_COLORS[t.name] } : undefined}
                className={cn(
                  "flex items-start gap-2.5 rounded-md border p-3 text-left transition-colors",
                  selected ? "bg-muted/40" : "border-border hover:bg-muted/50",
                )}
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: selected
                      ? CIRCUIT_COLORS[t.name]
                      : "var(--border)",
                  }}
                />
                <span>
                  <span className="block text-sm font-medium">{t.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {issues.track?.[0] && <FieldError>{issues.track[0]}</FieldError>}
      </fieldset>

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
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            name="linkedin"
            type="url"
            placeholder="https://linkedin.com/in/…"
            required
          />
          {err("linkedin") && <FieldError>{err("linkedin")}</FieldError>}
        </div>
      </div>

      <div>
        <Label htmlFor="availability">Availability</Label>
        <Input
          id="availability"
          name="availability"
          placeholder="e.g. any day except Tuesday morning"
          required
        />
        {err("availability") && <FieldError>{err("availability")}</FieldError>}
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
