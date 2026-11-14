import type { Metadata } from "next";
import Image from "next/image";
import { BoltShader } from "@/components/site/bolt-shader";
import { DriftingBolts } from "@/components/site/drifting-bolts";
import { LogoCell } from "@/components/site/power-grid";
import { ReportFor } from "@/components/site/report-for";
import { ReportGallery } from "@/components/site/report-gallery";
import { CountUp, GrowBar } from "@/components/site/report-motion";
import { ReportPdfButton } from "@/components/site/report-pdf-button";
import { ReportRail } from "@/components/site/report-rail";
import { listPartners, listSponsors } from "@/lib/admin/cms-queries";
import type { LogoEntityRow } from "@/lib/admin/cms-types";
import { circuitSponsor } from "@/lib/circuit-sponsors";
import {
  CHANNELS,
  CIRCUIT_PICKS,
  IMPACT,
  resolveOrg,
  POWERING,
  INDUSTRIES,
  NPS_SPLIT,
  PRESS,
  FEATURED_QUOTES,
  PHOTO_QUOTES,
  PLAIN_QUOTES,
  ROSTER_MARKS,
  ROSTER_ROWS,
  ROSTER_SCALE,
  splitAccent,
  RESPONSE_STATS,
  SPOTLIGHTS,
  WEEK_PHOTOS,
  WEEK_STATS,
  WHERE_FROM,
  WHO_THEY_ARE,
  type ReportPhoto,
  type ReportRow,
  type ReportStat,
} from "@/lib/sponsor-report";
import { sponsorMark } from "@/lib/sponsor-marks";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

// The 2026 sponsor report — the year in review, written for the sponsors and
// partners who powered it. Copy and numbers live in lib/sponsor-report.ts,
// verbatim from the signed-off report; this file is only how it reads here.
//
// Unlisted: it is a link Geekdom sends, so it stays out of search and out of
// the sitemap. A document rather than a page of the event site, so it lives
// in its own route group, without the site's navbar or footer: those offered
// a sponsor four ways off the report and a second ending after its own. The
// cover opens with the logo and the sign-off line closes it. The logo marks come from the CMS like every other wall on the
// site, so a replaced logo lands here without a deploy.
//
// Built to keep its reader: nothing here links off the report except the
// sponsors' own marks (new tab) and the contact address. The progress rail's
// stops are in-page anchors, and each section answers to its own #id. The
// designed PDF is /sponsor-report/print, saved to public/ by
// `pnpm report:pdf`.
export const revalidate = 300;

const TITLE = "2026 Sponsor Report";
const DESCRIPTION = "San Antonio Startup + Tech Week 2026 — the year in review for sponsors and partners.";

// The share tags are spelled out, not inherited. Left to the root layout, a
// pasted link unfurled with the report's card under the event's title and
// promo line, pointed og:url at the homepage, and X showed the site's default
// card — and a link is how this report gets read. The images come from
// opengraph-image.tsx and twitter-image.tsx beside this page.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  alternates: { canonical: "/sponsor-report" },
  openGraph: {
    type: "article",
    url: "/sponsor-report",
    siteName: "San Antonio Startup + Tech Week",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const MAGENTA = "#ff32a0";

async function safeList<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

/* ─── The section beats ─────────────────────────────────────────────────── */

type Tone = "dark" | "light";

function Eyebrow({ tone, className, children }: { tone: Tone; className?: string; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "font-mono text-xs uppercase tracking-widest",
        // Magenta's darker cut on white, where plain magenta misses AA at
        // this size (see --magenta-ink in globals.css).
        tone === "dark" ? "text-magenta" : "text-magenta-ink",
        className,
      )}
    >
      {children}
    </p>
  );
}

function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "mt-4 font-display text-5xl font-bold uppercase leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

function Lede({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "mt-6 max-w-2xl text-pretty text-lg sm:text-xl",
        tone === "dark" ? "text-white/65" : "text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}

function Section({
  id,
  tone,
  className,
  children,
}: {
  id: string;
  tone: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        // Clear of the section bar that stands in for the rail below 1400px.
        "scroll-mt-11 min-[1400px]:scroll-mt-0",
        tone === "dark" ? "border-t border-white/10 bg-black text-white" : "bg-white text-foreground",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">{children}</div>
    </section>
  );
}

const Accent = ({ children }: { children: React.ReactNode }) => (
  <span className="text-magenta">{children}</span>
);

/* ─── Pieces ────────────────────────────────────────────────────────────── */

/** A ruled grid of big numbers — the week in numbers, the survey. */
function StatGrid({ stats, tone, className }: { stats: ReportStat[]; tone: Tone; className?: string }) {
  const rule = tone === "dark" ? "border-white/10" : "border-border";
  return (
    <div className={cn("grid border-l border-t sm:grid-cols-2", rule, className)}>
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn("flex min-h-48 flex-col justify-between gap-6 border-b border-r p-7 break-inside-avoid lg:p-9", rule)}
        >
          <p
            className={cn(
              "font-display text-6xl font-bold leading-none tracking-tight tabular-nums lg:text-7xl",
              s.accent && "text-magenta",
            )}
          >
            <CountUp value={s.value} />
          </p>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest">{s.label}</p>
            {s.sub && (
              <p className={cn("mt-2 text-sm", tone === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {s.sub}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Labelled rows with a magenta bar under each — the audience breakdowns. */
function BarList({ title, rows }: { title: string; rows: ReportRow[] }) {
  return (
    <div>
      <Eyebrow tone="dark">{title}</Eyebrow>
      <ul className="mt-5">
        {rows.map((r) => (
          <li key={r.label} className="border-b border-white/10 py-4">
            <div className="flex items-baseline justify-between gap-5">
              <span className="font-display text-lg font-medium uppercase tracking-wide text-white">{r.label}</span>
              <span className="whitespace-nowrap font-display text-3xl font-bold tabular-nums text-magenta">
                {r.value}
              </span>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <GrowBar width={`${Math.max(r.share * 100, 1.5)}%`} className="rounded-full bg-magenta" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A dark callout with one big figure — combined reach, pitch capital. */
function Callout({
  eyebrow,
  figure,
  rest,
  children,
  className,
}: {
  eyebrow: string;
  figure: string;
  rest: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 border-l-4 border-l-magenta bg-black bg-linear-to-br from-magenta/20 via-black to-black p-8 text-white break-inside-avoid lg:p-12",
        className,
      )}
    >
      <Eyebrow tone="dark">{eyebrow}</Eyebrow>
      <p className="mt-4 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight lg:text-7xl">
        <Accent>
          <CountUp value={figure} />
        </Accent>{" "}
        {rest}
      </p>
      <p className="mt-5 max-w-2xl text-pretty text-white/70">{children}</p>
    </div>
  );
}

function Photo({ photo, sizes, className }: { photo: ReportPhoto; sizes: string; className?: string }) {
  return (
    <Image
      src={photo.src}
      width={photo.w}
      height={photo.h}
      alt={photo.alt}
      sizes={sizes}
      className={cn("h-auto w-full", className)}
    />
  );
}

// One magenta at five charges, the most-picked circuit carrying the most —
// the room-flow pattern. Circuits don't get their own colours.
const CHARGE = ["text-magenta", "text-magenta/80", "text-magenta/65", "text-magenta/50", "text-magenta/35"];

/* ─── The page ──────────────────────────────────────────────────────────── */

export default async function SponsorReportPage() {
  const [sponsors, partners] = await Promise.all([
    safeList(listSponsors()),
    safeList(listPartners()),
  ]);
  // Sponsors and partners in one lookup — the bands below credit both.
  const orgRow = (name: string) => resolveOrg(name, [...sponsors, ...partners]);
  // One colour across the roster, as its source sets it: the one-colour cut
  // where the CMS artwork needs one, the trimmed cut otherwise, and the
  // roster's own sizes in place of the homepage's CMS multipliers.
  const rosterMark = (r: LogoEntityRow): LogoEntityRow => ({
    ...r,
    imageUrl: ROSTER_MARKS[r.name] ?? sponsorMark(r.name, r.imageUrl),
    scale: ROSTER_SCALE[r.name],
  });
  // Every name keeps its place; one the CMS can't supply is set in type.
  const rosterRows = ROSTER_ROWS.map((row) => row.map((name) => ({ name, row: orgRow(name) })));

  return (
    // Print the colours as drawn: without this the browser drops every
    // background and the black sections come out as white type on white.
    <main className="[-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
      {/* ─── Cover ─── */}
      <section data-report-cover className="relative isolate flex flex-col overflow-hidden bg-black text-white lg:min-h-svh print:min-h-0">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60">
          <DriftingBolts />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(55% 55% at 75% 55%, rgba(255,50,160,0.16), transparent 70%)" }}
        />
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-6 py-10 lg:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Image
              src="/brand/sastw-horizontal-white.png"
              width={1600}
              height={400}
              alt="SASTW"
              priority
              className="h-9 w-auto sm:h-10"
            />
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">2026 Sponsor Report</p>
          </div>

          <div className="flex flex-1 items-end justify-between gap-10">
            <div className="max-w-4xl">
              <p className="font-mono text-xs uppercase tracking-widest text-magenta">
                San Antonio Startup + Tech Week · Sept 28 – Oct 2, 2026
              </p>
              <h1 className="mt-6 font-display text-[2.75rem] font-bold uppercase leading-[0.88] tracking-tight sm:text-7xl lg:text-[5.5rem] xl:text-[7rem]">
                You helped make
                <br /> the current
                <br /> <Accent>run through SA.</Accent>
              </h1>
              <p className="mt-7 max-w-2xl text-pretty text-lg text-white/75 sm:text-xl">
                Here&apos;s what the week looked like, what the community said, and where your support showed up.
              </p>
            </div>
            <div aria-hidden="true" className="hidden w-60 shrink-0 drop-shadow-[0_0_48px_rgba(255,50,160,0.45)] lg:block xl:w-72 print:hidden">
              <BoltShader color={MAGENTA} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-widest text-white/50">
            {/* Plain text, as the report has it: this page keeps its reader. */}
            <p>sasw.co</p>
            <p>Prepared November 2026</p>
          </div>
        </div>
      </section>

      {/* ─── The week in numbers ─── */}
      <Section id="numbers" tone="light">
        <Eyebrow tone="light">The week in numbers</Eyebrow>
        <Title>
          San Antonio
          <br /> <Accent>showed up.</Accent>
        </Title>
        <Lede tone="light">
          Five days, downtown. Three anchor venues. Seventy-two sessions. Eighty-seven speakers. One citywide moment
          for founders, builders, and the community that backs them.
        </Lede>
        <StatGrid stats={WEEK_STATS} tone="light" className="mt-14 lg:grid-cols-3" />
      </Section>

      {/* ─── Who showed up ─── */}
      <Section id="audience" tone="dark">
        <Eyebrow tone="dark">Who showed up</Eyebrow>
        <Title>
          The audience
          <br /> was <Accent>specific.</Accent>
        </Title>
        <Lede tone="dark">
          Not a general-interest crowd. SASTW drew the exact people sponsors want to reach — founders, operators,
          builders, and the capital and community moving around them.
        </Lede>

        {/* The two long lists side by side (seven rows and eight), so the
            columns end level; the three-row geography runs full width under
            them as big figures, where stacked into a column it left the other
            one short by half. */}
        <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-16">
          <BarList title="Who they are" rows={WHO_THEY_ARE} />
          <BarList title="Industries represented" rows={INDUSTRIES} />
        </div>

        <div className="mt-16">
          <Eyebrow tone="dark">Where they came from</Eyebrow>
          <ul className="mt-5 grid border-l border-t border-white/10 sm:grid-cols-3">
            {WHERE_FROM.map((r) => (
              <li key={r.label} className="flex flex-col gap-4 border-b border-r border-white/10 p-7 break-inside-avoid lg:p-8">
                <CountUp
                  value={r.value}
                  className="font-display text-6xl font-bold leading-none text-magenta lg:text-7xl"
                />
                <span className="font-display text-lg font-medium uppercase tracking-wide text-white">{r.label}</span>
                <div className="h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <GrowBar width={`${Math.max(r.share * 100, 1.5)}%`} className="rounded-full bg-magenta" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 rounded-2xl border border-white/10 border-l-4 border-l-magenta bg-white/4 p-8 break-inside-avoid lg:p-10">
          <Eyebrow tone="dark">Tech-adjacent audience</Eyebrow>
          <p className="mt-4 max-w-4xl text-pretty text-lg leading-relaxed text-white/80">
            <strong className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              423 registrants
            </strong>{" "}
            self-identified with a tech-adjacent industry — software, AI, cybersecurity, fintech, defense, biotech,
            manufacturing. That&apos;s <strong className="font-semibold text-white">49% of the audience</strong>,
            working in the exact sectors sponsors are trying to reach.
          </p>
        </div>
      </Section>

      {/* ─── Five Circuits ─── */}
      {/* On the brand pink, as the report has it. The cards are black, which
          is what lets the magenta charges read: on the pink itself they would
          vanish. */}
      <section id="circuits" data-report-pink className="scroll-mt-11 bg-magenta text-black min-[1400px]:scroll-mt-0">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">
          <Eyebrow tone="dark" className="text-black/70">
            Five Circuits
          </Eyebrow>
          <Title>
            One current.
            <br /> <span className="text-white">Five Circuits.</span>
          </Title>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-black/80 sm:text-xl">
            Every attendee picked at least one. On average, they picked almost three.
          </p>

          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CIRCUIT_PICKS.map((c, i) => (
              <li
                key={c.name}
                className={cn(
                  "flex flex-col rounded-2xl bg-black p-6 shadow-[0_18px_40px_rgba(0,0,0,0.25)] break-inside-avoid",
                  CHARGE[i],
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("h-1.5 w-10 rounded-full bg-current", i === 0 && "shadow-[0_0_14px_currentColor]")}
                />
                <p className="mt-5 min-h-[2.6em] font-display text-lg font-bold uppercase leading-tight text-white">
                  {c.name}
                </p>
                <CountUp value={c.count} className="mt-5 font-display text-5xl font-bold leading-none text-white" />
                <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-white/60">
                  {c.pct}% of registrants
                </p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <GrowBar width={`${c.pct}%`} className="rounded-full bg-current" delay={i * 0.08} />
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-10 font-mono text-xs uppercase tracking-widest text-black/75">
            Average: 2.73 Circuits per attendee · 2,491 total selections
          </p>
        </div>
      </section>

      {/* ─── The week in photos ─── */}
      <Section id="photos" tone="dark" className="border-t-0">
        <Eyebrow tone="dark">The week in photos</Eyebrow>
        <Title>
          This is what it
          <br /> <Accent>looked like.</Accent>
        </Title>
        <ReportGallery photos={WEEK_PHOTOS} />
      </Section>

      {/* ─── What the community said ─── */}
      <Section id="response" tone="light">
        <Eyebrow tone="light">What the community said</Eyebrow>
        <Title>
          The response
          <br /> was <Accent>strong.</Accent>
        </Title>

        <div className="mt-14 grid items-center gap-10 rounded-3xl bg-black p-8 text-white break-inside-avoid sm:p-12 lg:grid-cols-[auto_1fr] lg:gap-16 lg:p-16">
          <div>
            <p className="font-display text-[9rem] font-bold leading-[0.82] tracking-tight text-magenta sm:text-[12rem]">
              <CountUp value="65" />
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white">Net Promoter Score</p>
          </div>
          <div>
            <div className="h-3 overflow-hidden rounded-full" aria-hidden="true">
              <GrowBar width="100%" className="flex">
                <div className="bg-magenta" style={{ width: `${NPS_SPLIT[0]}%` }} />
                <div className="bg-magenta/40" style={{ width: `${NPS_SPLIT[1]}%` }} />
                <div className="bg-white/25" style={{ width: `${NPS_SPLIT[2]}%` }} />
              </GrowBar>
            </div>
            <p className="mt-6 max-w-xl text-pretty text-lg text-white/70">
              75% promoters · 15% passives · 10% detractors. Anything above 50 is considered excellent. SASTW landed
              well above that.
            </p>
          </div>
        </div>

        <StatGrid stats={RESPONSE_STATS} tone="light" className="mt-10 lg:grid-cols-4" />

        <Eyebrow tone="light" className="mt-20">
          What stuck with attendees
        </Eyebrow>
        {/* Three tiers, two across. The two short quotes are set as headlines
            over the people they're about — Nopalera's first, over its
            founder, a sponsor praised by name in a report written for
            sponsors. The two that name someone the report photographed sit
            beside that photo. The two about Access Granted stand on their own
            (see PHOTO_QUOTES). Every quote carries its own marks, so the
            opening one hangs in the margin and the text lines up behind it. */}
        <div className="mt-6 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {FEATURED_QUOTES.map((f) => {
              const [before, accent, after] = splitAccent(f.quote, f.accent);
              return (
                <figure
                  key={f.quote}
                  className="relative isolate flex min-h-[26rem] items-end overflow-hidden rounded-2xl bg-black p-8 text-white break-inside-avoid lg:min-h-[34rem] lg:p-10"
                >
                  <Image
                    src={f.photo.src}
                    alt={f.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 620px, 100vw"
                    className="-z-10 object-cover"
                    style={{ objectPosition: f.pos }}
                  />
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-black via-black/45 via-35% to-transparent to-75%" />
                  <blockquote className="max-w-xl text-pretty font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight indent-[-0.3em] sm:text-4xl lg:text-[2.75rem]">
                    {before}
                    <span className="text-magenta">{accent}</span>
                    {after}
                  </blockquote>
                </figure>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {PHOTO_QUOTES.map((q) => (
              <figure
                key={q.quote}
                className="grid overflow-hidden rounded-2xl border border-border bg-muted break-inside-avoid sm:grid-cols-[2fr_3fr]"
              >
                <div className="relative aspect-4/3 sm:aspect-auto sm:min-h-64">
                  <Image
                    src={q.photo.src}
                    alt={q.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 40vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: q.pos }}
                  />
                </div>
                <blockquote className="self-center p-7 text-pretty text-lg leading-relaxed text-foreground/85 indent-[-0.4em] lg:p-8">
                  {q.quote}
                </blockquote>
              </figure>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {PLAIN_QUOTES.map((q) => (
              <figure
                key={q}
                className="rounded-2xl border border-border border-l-4 border-l-magenta bg-muted p-7 break-inside-avoid lg:p-8"
              >
                <blockquote className="text-pretty text-lg leading-relaxed text-foreground/85 indent-[-0.4em]">{q}</blockquote>
              </figure>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── Reach beyond the room ─── */}
      <Section id="reach" tone="dark" className="border-t-0">
        <Eyebrow tone="dark">Reach beyond the room</Eyebrow>
        <Title>
          The current ran
          <br /> <Accent>wider than the week.</Accent>
        </Title>
        <Lede tone="dark">
          Email, Instagram, and LinkedIn carried the story across the summer and into October. Sponsors sat inside
          every touchpoint.
        </Lede>

        <div className="mt-14 grid border-l border-t border-white/10 lg:grid-cols-3">
          {CHANNELS.map((ch) => (
            <div key={ch.name} className="border-b border-r border-white/10 p-7 break-inside-avoid lg:p-8">
              <Eyebrow tone="dark">{ch.name}</Eyebrow>
              <dl className="mt-5">
                {ch.rows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 border-b border-white/10 py-3 last:border-b-0"
                  >
                    <dt className="font-mono text-[11px] uppercase tracking-widest text-white/55">{label}</dt>
                    <dd className="font-display text-2xl font-bold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <Callout eyebrow="Combined reach" figure="~45,000" rest="unique touches" className="mt-12">
          Across email, Instagram, LinkedIn, in-person attendance, and the full registered audience. The LinkedIn
          engagement rate of 12.5% is more than double the industry average.
        </Callout>
      </Section>

      {/* ─── Press coverage ─── */}
      <Section id="press" tone="light">
        <Eyebrow tone="light">Press coverage</Eyebrow>
        <Title>
          The story
          <br /> <Accent>traveled.</Accent>
        </Title>
        <Lede tone="light">
          Broadcast, digital, and national syndication picked up SASTW across the week. Media partners KENS 5, KSAT
          12, and TPR drove the local story. Yahoo News amplified it nationally.
        </Lede>

        <div className="mt-14 grid border-l border-t border-border lg:grid-cols-3">
          {PRESS.map((group) => (
            <div key={group.name} className="border-b border-r border-border p-7 break-inside-avoid lg:p-8">
              <Eyebrow tone="light">{group.name}</Eyebrow>
              <div className="mt-5 space-y-4">
                {group.items.map((it) => (
                  <p key={it.outlet} className="text-section leading-relaxed text-muted-foreground">
                    <strong className="font-semibold text-foreground">{it.outlet}</strong>
                    {/* DEVSA's line runs on from its name; the rest are set off. */}
                    {it.text.startsWith("and ") ? " " : " — "}
                    {it.text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Callout eyebrow="Capital deployed on stage" figure="$110,000" rest="in pitch funding" className="mt-12">
          Deployed live during Latin Tech Pitch and Mission Pitch at Texas Public Radio. Press coverage named these as
          marquee capital moments of the week.
        </Callout>
      </Section>

      {/* ─── Where sponsors showed up ─── */}
      <Section id="sponsors" tone="dark" className="border-t-0">
        <Eyebrow tone="dark">Where sponsors showed up</Eyebrow>
        <Title>
          Your brand
          <br /> <Accent>plugged in.</Accent>
        </Title>
        <Lede tone="dark">
          Every sponsor had a named place in the week — on stage, in the room, in the inbox, and across every channel
          that carried the story.
        </Lede>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {SPOTLIGHTS.map((s, i) => {
            const sponsor = circuitSponsor(s.circuit, sponsors);
            const portrait = s.photo.h > s.photo.w;
            return (
              <article
                key={s.circuit}
                data-org={sponsor ? slugify(sponsor.name) : undefined}
                className="group/spot grid items-center gap-8 break-inside-avoid lg:grid-cols-2 lg:gap-16"
              >
                <div className={cn(i % 2 === 1 && "lg:order-2")}>
                  <p className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl">
                    {s.circuit} <Accent>Circuit</Accent>
                  </p>
                  <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-white/50">presented by</p>
                  {sponsor ? (
                    <a
                      href={sponsor.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magenta"
                    >
                      <Image
                        src={sponsor.imageUrl}
                        alt={sponsor.name}
                        width={480}
                        height={160}
                        className={cn(
                          "w-auto object-contain",
                          sponsor.name === "Webhead" ? "h-16 sm:h-20" : "h-9 sm:h-11",
                        )}
                      />
                    </a>
                  ) : null}
                  <p className="mt-8 flex items-start gap-3 font-mono text-xs uppercase leading-relaxed tracking-widest text-white/60">
                    <span aria-hidden="true" className="mt-1.5 h-px w-6 shrink-0 bg-magenta" />
                    {s.caption}
                  </p>
                </div>
                <figure
                  className={cn(
                    "overflow-hidden rounded-2xl ring-1 ring-white/10 transition-shadow duration-500 group-data-lit/spot:ring-2 group-data-lit/spot:ring-magenta",
                    portrait && "mx-auto w-full max-w-md",
                  )}
                >
                  <Photo photo={s.photo} sizes={portrait ? "(min-width: 1024px) 448px, 100vw" : "(min-width: 1024px) 600px, 100vw"} />
                </figure>
              </article>
            );
          })}
        </div>

        <div className="mt-24 space-y-4">
          {POWERING.map((band, i) => (
            <div
              key={band.title}
              data-band
              className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-white/3 transition-colors duration-500 break-inside-avoid data-lit:border-magenta/60 data-lit:bg-magenta/10"
            >
              {/* Startup Bash wears its own texture, the week's drifting bolts. */}
              {i === 0 && (
                <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-40">
                  <DriftingBolts />
                </div>
              )}
              <div className="grid items-center gap-8 p-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:p-10">
                <p className="font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl">
                  <span className="block font-mono text-xs font-normal tracking-widest text-magenta">
                    {band.lead}
                  </span>
                  <span className="mt-3 block text-balance">{band.title}</span>
                </p>
                <ul className="flex flex-wrap items-center gap-x-8 gap-y-6 lg:justify-end">
                  {band.orgs.map((name) => {
                    const row = orgRow(name);
                    return (
                      <li key={name} data-org={slugify(name)} className="w-28 sm:w-36">
                        {row?.imageUrl ? (
                          <LogoCell row={{ ...row, imageUrl: sponsorMark(row.name, row.imageUrl) }} size="sm" />
                        ) : (
                          // No mark in the CMS yet, so the name stands in it.
                          <span className="block text-center font-display text-xl font-bold uppercase tracking-wide text-white/85">
                            {name}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Already plugged in ─── */}
      {/* The fourteen on the report's own roster graphic, in its rows
          (ROSTER_ROWS), not every row in the CMS — the CMS supplies the
          marks. Centred, so the two-mark row sits between its neighbours as
          it does there. */}
      <Section id="roster" tone="dark" className="overflow-x-clip">
        <Eyebrow tone="dark">Already plugged in</Eyebrow>
        <Title>
          The full
          <br /> <Accent>backing roster.</Accent>
        </Title>
        <Lede tone="dark">
          A thank you to every organization that powered the current this year — financially, operationally, and in
          community.
        </Lede>
        <div className="mt-14 space-y-10 sm:space-y-12">
          {rosterRows.map((row, r) => (
            <div key={r} className="flex justify-center gap-x-6 sm:gap-x-10">
              {row.map(({ name, row: org }) => (
                <div key={name} data-org={slugify(name)} className="w-1/3 max-w-80">
                  {org ? (
                    <LogoCell row={rosterMark(org)} size="fluid" mono />
                  ) : (
                    <span className="block text-center font-display text-xl font-bold uppercase tracking-wide text-white/85">
                      {name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* ─── What you enabled ─── */}
      <Section id="impact" tone="light">
        <Eyebrow tone="light">What you enabled</Eyebrow>
        <Title>
          This week
          <br /> doesn&apos;t happen
          <br /> <Accent>without you.</Accent>
        </Title>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {IMPACT.map((it) => (
            <div key={it.label} className="border-t-2 border-magenta pt-6 break-inside-avoid">
              <CountUp
                value={it.value}
                className="block font-display text-6xl font-bold leading-none tracking-tight text-magenta"
              />
              <p className="mt-4 font-mono text-xs uppercase tracking-widest">{it.label}</p>
              <p className="mt-2 text-pretty text-section leading-relaxed text-muted-foreground">{it.sub}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── See you in 2027 ─── */}
      <section id="thank-you" data-report-pink className="scroll-mt-11 bg-magenta text-black break-inside-avoid min-[1400px]:scroll-mt-0">
        <div className="mx-auto w-full max-w-7xl px-6 py-24 text-center lg:py-32">
          <p className="font-mono text-xs uppercase tracking-widest text-black/70">See you in 2027</p>
          <h2 className="mt-6 font-display text-[2.5rem] font-bold uppercase leading-[0.88] tracking-tight sm:text-7xl lg:text-9xl">
            Thank you
            <br /> for plugging in.
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-pretty text-lg text-black/80 sm:text-xl">
            The current ran through SA this year because you helped power it. We&apos;d love to build what&apos;s
            next with you.
          </p>
          <div className="mt-12">
            <p className="font-display text-2xl font-bold uppercase tracking-wide">Leslie Chasnoff</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-black/70">
              Director of Programs &amp; Partnerships · Geekdom
            </p>
            <a
              href="mailto:lesliechasnoff@geekdom.com"
              className="mt-7 inline-flex h-13 items-center rounded-md bg-black px-7 text-lg font-medium text-white transition-colors hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-magenta"
            >
              lesliechasnoff@geekdom.com
            </a>
          </div>
        </div>
      </section>

      <div className="bg-black px-6 py-10 text-center font-mono text-xs uppercase tracking-widest text-white/50">
        San Antonio Startup + Tech Week · sasw.co · A Geekdom initiative
      </div>

      <ReportFor />
      <ReportRail />
      <ReportPdfButton />
    </main>
  );
}
