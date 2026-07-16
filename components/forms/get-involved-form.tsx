"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TRACK_NAMES, CIRCUIT_COLORS, type TrackName } from "@/lib/tracks";
import {
  BUDGET_RANGES,
  VENUE_STATUS,
  HEARD_ABOUT,
  SCHEDULE_CAVEAT,
  type GetInvolvedPath,
} from "@/lib/get-involved";

type FieldErrors = Record<string, string[] | undefined>;

const TABS: { key: GetInvolvedPath; label: string; blurb: string }[] = [
  { key: "sponsor", label: "Sponsor", blurb: "Power the week." },
  { key: "host", label: "Host an event", blurb: "Add to the grid." },
  { key: "general", label: "General", blurb: "Ask us anything." },
];

// Confirmation copy per path, from the 2026 form requirements.
const CONFIRMATIONS: Record<GetInvolvedPath, string> = {
  sponsor:
    "Someone from our sponsor team will be in touch within 2 business days.",
  host: "We'll review your submission and get back to you within 5 business days. Some anchor events and key session dates/times are locked, so if we need to shift your time, we'll work it out with you.",
  general: "We'll get back to you as soon as we can, typically within 3 business days.",
};

export function GetInvolvedForm() {
  const [path, setPath] = React.useState<GetInvolvedPath>("sponsor");
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState<GetInvolvedPath | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<FieldErrors>({});

  // Choices that don't live in native inputs.
  const [budget, setBudget] = React.useState("");
  const [audience, setAudience] = React.useState<TrackName[]>([]);
  const [venue, setVenue] = React.useState("");
  const [heardAbout, setHeardAbout] = React.useState("");

  function choose(p: GetInvolvedPath) {
    setPath(p);
    setError(null);
    setIssues({});
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setIssues({});

    const form = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(form.entries()),
      path,
      budget,
      audience,
      venue,
      heardAbout,
    };

    try {
      const res = await fetch("/api/get-involved", {
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
      setDone(path);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-white p-8">
        <h2 className="font-display text-heading font-bold">Got it.</h2>
        <p className="mt-2 text-muted-foreground">{CONFIRMATIONS[done]}</p>
        <p className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
          Plug in.
        </p>
      </div>
    );
  }

  const err = (f: string) => issues[f]?.[0];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Path picker ─────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="What brings you here today?"
        className="grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-muted/40 p-1.5"
      >
        {TABS.map((t) => {
          const on = path === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={on}
              onClick={() => choose(t.key)}
              className={cn(
                "rounded-md px-3 py-2.5 text-left transition-all",
                on
                  ? "bg-foreground text-white shadow-sm"
                  : "text-muted-foreground hover:bg-white hover:text-foreground",
              )}
            >
              <span className="block text-sm font-medium">{t.label}</span>
              <span
                className={cn(
                  "hidden text-[11px] sm:block",
                  on ? "text-magenta" : "text-muted-foreground/70",
                )}
              >
                {t.blurb}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
        {/* ── Who you are ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          <SectionLabel>Who you are</SectionLabel>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="gi-name">Full name</Label>
              <Input id="gi-name" name="name" autoComplete="name" required />
              {err("name") && <FieldError>{err("name")}</FieldError>}
            </div>
            <div>
              <Label htmlFor="gi-email">Email</Label>
              <Input
                id="gi-email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
              {err("email") && <FieldError>{err("email")}</FieldError>}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="gi-phone">Phone</Label>
              <Input
                id="gi-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
              />
              {err("phone") && <FieldError>{err("phone")}</FieldError>}
            </div>
            <div>
              <Label htmlFor="gi-company">Company or organization</Label>
              <Input
                id="gi-company"
                name="company"
                autoComplete="organization"
                required
              />
              {err("company") && <FieldError>{err("company")}</FieldError>}
            </div>
          </div>
          <div className="sm:max-w-sm">
            <Label htmlFor="gi-role">Role / title</Label>
            <Input
              id="gi-role"
              name="role"
              autoComplete="organization-title"
              required
            />
            {err("role") && <FieldError>{err("role")}</FieldError>}
          </div>
        </section>

        {/* ── Path details ────────────────────────────────────────────── */}
        {path === "sponsor" && (
          <section className="flex flex-col gap-5">
            <SectionLabel>Sponsorship</SectionLabel>
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-foreground">
                Ballpark budget range
              </legend>
              <ChipGroup>
                {BUDGET_RANGES.map((b) => (
                  <Chip key={b} on={budget === b} onClick={() => setBudget(b)}>
                    {b}
                  </Chip>
                ))}
              </ChipGroup>
              {err("budget") && <FieldError>{err("budget")}</FieldError>}
            </fieldset>
            <div>
              <Label htmlFor="gi-anchor">
                Any specific anchor event you&apos;d like your brand attached
                to? (optional)
              </Label>
              <Input id="gi-anchor" name="anchorEvent" />
            </div>
            <div>
              <Label htmlFor="gi-goals">
                What are your goals for this sponsorship? (optional)
              </Label>
              <Textarea
                id="gi-goals"
                name="goals"
                rows={3}
                placeholder="Audience you want to reach, visibility, hiring…"
              />
            </div>
          </section>
        )}

        {path === "host" && (
          <section className="flex flex-col gap-5">
            <SectionLabel>Your event</SectionLabel>
            <div>
              <Label htmlFor="gi-concept">What event do you want to host?</Label>
              <Textarea
                id="gi-concept"
                name="eventConcept"
                rows={4}
                placeholder="Working title, format, concept…"
                required
              />
              {err("eventConcept") && (
                <FieldError>{err("eventConcept")}</FieldError>
              )}
            </div>
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-foreground">
                Who&apos;s the audience?
              </legend>
              <ChipGroup>
                {TRACK_NAMES.map((t) => {
                  const on = audience.includes(t);
                  return (
                    <Chip
                      key={t}
                      on={on}
                      onClick={() =>
                        setAudience(
                          on
                            ? audience.filter((a) => a !== t)
                            : [...audience, t],
                        )
                      }
                      style={
                        on
                          ? {
                              borderColor: CIRCUIT_COLORS[t],
                              backgroundColor: `${CIRCUIT_COLORS[t]}14`,
                            }
                          : undefined
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                        style={{ backgroundColor: CIRCUIT_COLORS[t] }}
                      />
                      {t}
                    </Chip>
                  );
                })}
              </ChipGroup>
              {err("audience") && <FieldError>{err("audience")}</FieldError>}
            </fieldset>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="gi-attendance">
                  Expected attendance (optional)
                </Label>
                <Input
                  id="gi-attendance"
                  name="attendance"
                  placeholder="Rough number"
                />
              </div>
              <div>
                <Label htmlFor="gi-time">Preferred day and time (optional)</Label>
                <Input id="gi-time" name="preferredTime" />
              </div>
            </div>
            <p className="-mt-3 text-xs text-muted-foreground">
              {SCHEDULE_CAVEAT}
            </p>
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-foreground">
                Do you need a venue, or do you have one?
              </legend>
              <ChipGroup>
                {VENUE_STATUS.map((v) => (
                  <Chip key={v} on={venue === v} onClick={() => setVenue(v)}>
                    {v}
                  </Chip>
                ))}
              </ChipGroup>
              {err("venue") && <FieldError>{err("venue")}</FieldError>}
            </fieldset>
            <div>
              <Label htmlFor="gi-cosponsors">
                Are there additional sponsors or partners involved? (optional)
              </Label>
              <Textarea id="gi-cosponsors" name="coSponsors" rows={2} />
            </div>
          </section>
        )}

        {path === "general" && (
          <section className="flex flex-col gap-5">
            <SectionLabel>Your question</SectionLabel>
            <div>
              <Label htmlFor="gi-question">What&apos;s your question?</Label>
              <Textarea id="gi-question" name="question" rows={4} required />
              {err("question") && <FieldError>{err("question")}</FieldError>}
            </div>
          </section>
        )}

        {/* ── Wrap-up ─────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          <SectionLabel>Almost done · optional</SectionLabel>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="gi-heard">How did you hear about SASTW?</Label>
              <Combobox
                id="gi-heard"
                options={HEARD_ABOUT.map((o) => ({ value: o, label: o }))}
                value={heardAbout}
                onChange={setHeardAbout}
                placeholder="Select one…"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="gi-notes">Anything else we should know?</Label>
            <Textarea id="gi-notes" name="notes" rows={3} />
          </div>
        </section>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className="sm:w-fit">
          {pending ? "Sending…" : "Send it"}
        </Button>
      </form>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  on,
  onClick,
  style,
  children,
}: {
  on: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={style}
      className={cn(
        "rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
        on
          ? "border-magenta bg-magenta/5 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted/50",
      )}
    >
      {children}
    </button>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
