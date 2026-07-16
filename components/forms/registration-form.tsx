"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TRACK_NAMES, CIRCUIT_COLORS, type TrackName } from "@/lib/tracks";
import {
  DESCRIBES_YOU,
  INDUSTRIES,
  SA_TENURE,
  VOLUNTEER_DAYS,
  SPONSOR_CONSENT_LABEL,
} from "@/lib/registration";

type FieldErrors = Record<string, string[] | undefined>;

export function RegistrationForm() {
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<FieldErrors>({});

  // Choices that don't live in native inputs.
  const [describesYou, setDescribesYou] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [circuits, setCircuits] = React.useState<TrackName[]>([]);
  const [firstTime, setFirstTime] = React.useState<boolean | undefined>();
  const [volunteer, setVolunteer] = React.useState<boolean | undefined>();
  const [volunteerDays, setVolunteerDays] = React.useState<string[]>([]);
  const [consent, setConsent] = React.useState(false);

  function toggle<T extends string>(
    list: T[],
    set: React.Dispatch<React.SetStateAction<T[]>>,
    value: T,
  ) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setIssues({});

    const form = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(form.entries()),
      describesYou,
      industry,
      circuits,
      firstTime,
      volunteerInterested: volunteer,
      volunteerDays: volunteer ? volunteerDays : [],
      sponsorConsent: consent,
    };

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
          Watch your inbox for weekly emails leading up to the week, then daily
          during it. See you September 28.
        </p>
        <p className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
          Plug in.
        </p>
      </div>
    );
  }

  const err = (f: string) => issues[f]?.[0];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
      {/* ── Required ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" autoComplete="name" required />
            {err("name") && <FieldError>{err("name")}</FieldError>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            {err("email") && <FieldError>{err("email")}</FieldError>}
          </div>
        </div>
        <div className="sm:max-w-48">
          <Label htmlFor="zip">ZIP code</Label>
          <Input
            id="zip"
            name="zip"
            inputMode="numeric"
            maxLength={5}
            autoComplete="postal-code"
            required
          />
          {err("zip") && <FieldError>{err("zip")}</FieldError>}
        </div>
      </section>

      {/* ── About you (optional) ─────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <SectionLabel>About you · optional</SectionLabel>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="describesYou">Which best describes you?</Label>
            <Combobox
              id="describesYou"
              options={DESCRIBES_YOU.map((o) => ({ value: o, label: o }))}
              value={describesYou}
              onChange={setDescribesYou}
              placeholder="Select one…"
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Combobox
              id="industry"
              options={INDUSTRIES.map((o) => ({ value: o, label: o }))}
              value={industry}
              onChange={setIndustry}
              placeholder="Select one…"
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="company">Company or organization</Label>
            <Input id="company" name="company" autoComplete="organization" />
          </div>
          <div>
            <Label htmlFor="role">Role / title</Label>
            <Input id="role" name="role" autoComplete="organization-title" />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-foreground">
            How long have you been in San Antonio?
          </legend>
          <ChipGroup>
            {SA_TENURE.map((o) => (
              <RadioChip key={o} name="saTenure" value={o} />
            ))}
          </ChipGroup>
        </fieldset>
      </section>

      {/* ── Your week (optional) ─────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <SectionLabel>Your week · optional</SectionLabel>
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-foreground">
            Which Circuits are you most excited about?
          </legend>
          <ChipGroup>
            {TRACK_NAMES.map((t) => {
              const on = circuits.includes(t);
              return (
                <Chip
                  key={t}
                  on={on}
                  onClick={() => toggle(circuits, setCircuits, t)}
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
        </fieldset>
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-foreground">
            First time at Startup + Tech Week?
          </legend>
          <ChipGroup>
            <Chip on={firstTime === true} onClick={() => setFirstTime(true)}>
              Yes
            </Chip>
            <Chip on={firstTime === false} onClick={() => setFirstTime(false)}>
              No
            </Chip>
          </ChipGroup>
        </fieldset>
      </section>

      {/* ── Volunteering (optional) ──────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <SectionLabel>Volunteering · optional</SectionLabel>
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-foreground">
            Interested in volunteering during the week?
          </legend>
          <ChipGroup>
            <Chip on={volunteer === true} onClick={() => setVolunteer(true)}>
              Yes
            </Chip>
            <Chip on={volunteer === false} onClick={() => setVolunteer(false)}>
              No
            </Chip>
          </ChipGroup>
        </fieldset>
        {volunteer && (
          <>
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-foreground">
                Which days can you volunteer?
              </legend>
              <ChipGroup>
                {VOLUNTEER_DAYS.map((d) => (
                  <Chip
                    key={d}
                    on={volunteerDays.includes(d)}
                    onClick={() => toggle(volunteerDays, setVolunteerDays, d)}
                  >
                    {d}
                  </Chip>
                ))}
              </ChipGroup>
            </fieldset>
            <div>
              <Label htmlFor="volunteerNotes">Any preferences?</Label>
              <Input
                id="volunteerNotes"
                name="volunteerNotes"
                placeholder="Mornings, check-in table, AV…"
              />
            </div>
          </>
        )}
      </section>

      {/* ── Sponsor consent ──────────────────────────────────────────── */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff32a0]"
        />
        <span className="text-sm text-muted-foreground">
          {SPONSOR_CONSENT_LABEL}
        </span>
      </label>

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

/** Toggle chip driven by React state (multi-selects, yes/no). */
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

/** Single-select chip backed by a native radio, so it submits via FormData. */
function RadioChip({ name, value }: { name: string; value: string }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} className="peer sr-only" />
      <span
        className={cn(
          "inline-block rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
          "border-border text-muted-foreground hover:bg-muted/50",
          "peer-checked:border-magenta peer-checked:bg-magenta/5 peer-checked:text-foreground",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-magenta peer-focus-visible:ring-offset-1",
        )}
      >
        {value}
      </span>
    </label>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}
