import type { Metadata } from "next";
import Image from "next/image";
import { listPartners, listSponsors } from "@/lib/admin/cms-queries";
import type { LogoEntityRow } from "@/lib/admin/cms-types";
import { circuitSponsor } from "@/lib/circuit-sponsors";
import {
  CHANNELS,
  CIRCUIT_PICKS,
  IMPACT,
  INDUSTRIES,
  LOCAL_MARKS,
  NPS_SPLIT,
  POWERING,
  PRESS,
  FEATURED_QUOTES,
  PHOTO_QUOTES,
  PLAIN_QUOTES,
  ROSTER,
  splitAccent,
  RESPONSE_STATS,
  SPOTLIGHTS,
  WEEK_PHOTOS,
  WEEK_STATS,
  WHERE_FROM,
  WHO_THEY_ARE,
  type ReportPhoto,
  type ReportRow,
} from "@/lib/sponsor-report";
import { sponsorMark } from "@/lib/sponsor-marks";
import { cn } from "@/lib/utils";

// The sponsor report as a document: US Letter pages, laid out one section to
// a page, which `pnpm report:pdf` (tools/sponsor-report/pdf.mjs) renders with
// headless Chrome and saves to public/ as the PDF the report's button hands
// out. Same words, same photos, same marks as /sponsor-report — it reads the
// same data file, so the two can't drift — composed for paper instead of a
// scroll: fixed pages, a page number and the report's own sign-off line on
// each, and no motion.
//
// In its own route group so it gets no navbar or footer. Unlisted, like the
// report.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "2026 Sponsor Report",
  robots: { index: false, follow: false },
};

async function safeList<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

/* ─── Page furniture ────────────────────────────────────────────────────── */

type Tone = "dark" | "light" | "pink";

const TONE: Record<Tone, string> = {
  dark: "bg-black text-white",
  light: "bg-white text-black",
  pink: "bg-magenta text-black",
};

const FOOT: Record<Tone, string> = {
  dark: "text-white/45 border-white/10",
  light: "text-black/45 border-black/10",
  pink: "text-black/60 border-black/15",
};

/** One sheet of US Letter, 8.5 × 11 in at 96 px to the inch. */
function Sheet({
  tone,
  n,
  total,
  children,
  className,
}: {
  tone: Tone;
  /** Page number; the cover passes none and gets no footer. */
  n?: number;
  total: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("sheet relative flex h-264 w-204 flex-col overflow-hidden", TONE[tone])}>
      <div className={cn("flex flex-1 flex-col px-14 pb-20 pt-14", className)}>{children}</div>
      {n !== undefined && (
        <footer
          className={cn(
            "absolute inset-x-14 bottom-7 flex items-center justify-between border-t pt-3 font-mono text-[9px] uppercase tracking-widest",
            FOOT[tone],
          )}
        >
          <span>San Antonio Startup + Tech Week · sasw.co · A Geekdom initiative</span>
          <span className="tabular-nums">
            {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </footer>
      )}
    </section>
  );
}

function Eyebrow({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "font-mono text-[10px] uppercase tracking-widest",
        tone === "dark" ? "text-magenta" : tone === "light" ? "text-magenta-ink" : "text-black/70",
      )}
    >
      {children}
    </p>
  );
}

function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("mt-3 font-display text-[46px] font-bold uppercase leading-[0.92] tracking-tight", className)}>
      {children}
    </h2>
  );
}

function Lede({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <p className={cn("mt-4 max-w-140 text-[14px] leading-relaxed", tone === "dark" ? "text-white/65" : "text-black/65")}>
      {children}
    </p>
  );
}

const Accent = ({ children }: { children: React.ReactNode }) => (
  <span className="text-magenta">{children}</span>
);

/** A mark in a fixed box, drawn whole. */
function Mark({ src, alt, className, left }: { src: string; alt: string; className: string; left?: boolean }) {
  return (
    <span className={cn("relative block", className)}>
      <Image src={src} alt={alt} fill sizes="320px" loading="eager" className={cn("object-contain", left && "object-left")} />
    </span>
  );
}

/**
 * Unoptimized on purpose: the optimizer answers Chrome with WebP, which Chrome
 * re-encodes losslessly into the PDF — 28 MB for this report. The originals
 * are JPEGs (1,200–1,600 px, already sized for print), and a JPEG goes into
 * the PDF as it is.
 */
function Photo({ photo, className }: { photo: ReportPhoto; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden rounded-lg", className)}>
      <Image src={photo.src} alt={photo.alt} fill unoptimized loading="eager" className="object-cover" />
    </span>
  );
}

function Bars({ title, rows }: { title: string; rows: ReportRow[] }) {
  return (
    <div>
      <Eyebrow tone="dark">{title}</Eyebrow>
      <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.label} className="border-b border-white/10 py-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-[12.5px] font-medium uppercase tracking-wide">{r.label}</span>
              <span className="font-display text-[19px] font-bold tabular-nums text-magenta">{r.value}</span>
            </div>
            <div className="mt-1 h-0.75 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-magenta" style={{ width: `${Math.max(r.share * 100, 1.5)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Callout({ eyebrow, figure, rest, children }: { eyebrow: string; figure: string; rest: string; children: React.ReactNode }) {
  return (
    <div className="mt-auto rounded-xl border border-white/10 border-l-4 border-l-magenta bg-black bg-linear-to-tl from-magenta/25 via-black to-black p-7 text-white">
      <Eyebrow tone="dark">{eyebrow}</Eyebrow>
      <p className="mt-2 font-display text-[44px] font-bold uppercase leading-none tracking-tight">
        <Accent>{figure}</Accent> {rest}
      </p>
      <p className="mt-3 max-w-140 text-[12.5px] leading-relaxed text-white/70">{children}</p>
    </div>
  );
}

// One magenta at five charges, as on the web page.
const CHARGE = ["text-magenta", "text-magenta/80", "text-magenta/65", "text-magenta/50", "text-magenta/35"];

/* ─── The document ──────────────────────────────────────────────────────── */

export default async function SponsorReportPrint() {
  const [sponsors, partners] = await Promise.all([safeList(listSponsors()), safeList(listPartners())]);
  const orgRow = (name: string): LogoEntityRow | undefined => {
    const row = [...sponsors, ...partners].find((r) => r.name.trim().toLowerCase() === name.toLowerCase());
    if (row) return row;
    const local = LOCAL_MARKS[name];
    return local && { id: name, name, ...local, createdAt: 0 };
  };
  // The organizations the report credits, not every CMS row — see ROSTER.
  const roster = ROSTER.map(orgRow).filter((r): r is LogoEntityRow => Boolean(r?.imageUrl));
  const isPartner = (r: LogoEntityRow) => partners.some((p) => p.id === r.id);
  const rosterSponsors = roster.filter((r) => !isPartner(r));
  const rosterPartners = roster.filter(isPartner);

  // One designed photo page, not the web page's full wall: 36 photos in
  // print were three straight pages of identical grids — a contact sheet that
  // stalled the document — and repeated photos the PDF already shows in the
  // circuit spotlights and the quotes. These eight are picked for range
  // (stage, packed rooms, networking, the community groups) and none of them
  // appears anywhere else in the PDF. The web page keeps all 36.
  const pick = (src: string) => {
    const found = WEEK_PHOTOS.find((p) => p.src === src);
    if (!found) throw new Error(`sponsor report PDF: no photo ${src}`);
    return found;
  };
  const spread: { photo: ReportPhoto; cell: string }[] = [
    { photo: pick("/sponsor-report/week-02.jpg"), cell: "col-span-3 row-span-2" },
    { photo: pick("/sponsor-report/week-07.jpg"), cell: "row-span-2" },
    { photo: pick("/home/recap/r18.jpg"), cell: "col-span-2" },
    { photo: pick("/sponsor-report/week-06.jpg"), cell: "col-span-2" },
    { photo: pick("/home/recap/r15.jpg"), cell: "" },
    { photo: pick("/home/recap/r16.jpg"), cell: "" },
    { photo: pick("/home/recap/r08.jpg"), cell: "" },
    { photo: pick("/home/recap/r25.jpg"), cell: "" },
  ];
  const [founder, ...otherSpotlights] = SPOTLIGHTS;

  const pages: { tone: Tone; body: React.ReactNode; className?: string }[] = [
    /* The week in numbers */
    {
      tone: "light",
      body: (
        <>
          <Eyebrow tone="light">The week in numbers</Eyebrow>
          <Title>
            San Antonio
            <br /> <Accent>showed up.</Accent>
          </Title>
          <Lede tone="light">
            Five days, downtown. Three anchor venues. Seventy-two sessions. Eighty-seven speakers. One citywide
            moment for founders, builders, and the community that backs them.
          </Lede>
          <div className="mt-10 grid flex-1 grid-cols-2 grid-rows-3 border-l border-t border-black/10">
            {WEEK_STATS.map((s) => (
              <div key={s.label} className="flex flex-col justify-between border-b border-r border-black/10 p-6">
                <p className={cn("font-display text-title font-bold leading-none tracking-tight tabular-nums", s.accent && "text-magenta")}>
                  {s.value}
                </p>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest">{s.label}</p>
                  {s.sub && <p className="mt-1.5 text-caption leading-snug text-black/60">{s.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    },
    /* Who showed up */
    {
      tone: "dark",
      body: (
        <>
          <Eyebrow tone="dark">Who showed up</Eyebrow>
          <Title>
            The audience
            <br /> was <Accent>specific.</Accent>
          </Title>
          <Lede tone="dark">
            Not a general-interest crowd. SASTW drew the exact people sponsors want to reach — founders, operators,
            builders, and the capital and community moving around them.
          </Lede>
          <div className="mt-7 grid grid-cols-2 gap-8">
            <Bars title="Who they are" rows={WHO_THEY_ARE} />
            <Bars title="Industries represented" rows={INDUSTRIES} />
          </div>
          <div className="mt-6">
            <Eyebrow tone="dark">Where they came from</Eyebrow>
            <div className="mt-2 grid grid-cols-3 border-l border-t border-white/10">
              {WHERE_FROM.map((r) => (
                <div key={r.label} className="border-b border-r border-white/10 px-5 py-4">
                  <p className="font-display text-[38px] font-bold leading-none tabular-nums text-magenta">{r.value}</p>
                  <p className="mt-2 font-display text-[12.5px] font-medium uppercase tracking-wide">{r.label}</p>
                  <div className="mt-2 h-0.75 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-magenta" style={{ width: `${Math.max(r.share * 100, 1.5)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto rounded-xl border border-white/10 border-l-4 border-l-magenta bg-white/5 px-6 py-5">
            <Eyebrow tone="dark">Tech-adjacent audience</Eyebrow>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/80">
              <strong className="font-display text-[17px] font-bold uppercase tracking-wide text-white">423 registrants</strong>{" "}
              self-identified with a tech-adjacent industry — software, AI, cybersecurity, fintech, defense, biotech,
              manufacturing. That&apos;s <strong className="font-semibold text-white">49% of the audience</strong>, working in
              the exact sectors sponsors are trying to reach.
            </p>
          </div>
        </>
      ),
    },
    /* Five Circuits */
    {
      tone: "pink",
      body: (
        <>
          <Eyebrow tone="pink">Five Circuits</Eyebrow>
          <Title className="text-[56px] leading-[0.92]">
            One current.
            <br /> <span className="text-white">Five Circuits.</span>
          </Title>
          <p className="mt-4 max-w-140 text-section leading-relaxed text-black/80">
            Every attendee picked at least one. On average, they picked almost three.
          </p>
          <ol className="mt-10 flex flex-1 flex-col gap-3">
            {CIRCUIT_PICKS.map((c, i) => (
              <li key={c.name} className={cn("flex flex-1 items-center gap-6 rounded-xl bg-black px-7", CHARGE[i])}>
                <span className={cn("h-1.5 w-9 shrink-0 rounded-full bg-current", i === 0 && "shadow-[0_0_12px_currentColor]")} />
                <span className="flex-1 font-display text-[20px] font-bold uppercase leading-tight text-white">{c.name}</span>
                <span className="w-25 text-right font-display text-[48px] font-bold leading-none tabular-nums text-white">
                  {c.count}
                </span>
                <span className="w-42.5">
                  <span className="block font-mono text-[9.5px] uppercase tracking-widest text-white/60">
                    {c.pct}% of registrants
                  </span>
                  <span className="mt-2 block h-0.75 rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-current" style={{ width: `${c.pct}%` }} />
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-black/75">
            Average: 2.73 Circuits per attendee · 2,491 total selections
          </p>
        </>
      ),
    },
    /* The week in photos — one spread */
    {
      tone: "dark",
      body: (
        <>
          <Eyebrow tone="dark">The week in photos</Eyebrow>
          <Title>
            This is what it
            <br /> <Accent>looked like.</Accent>
          </Title>
          <div className="mt-7 grid flex-1 grid-cols-4 grid-rows-4 gap-2">
            {spread.map(({ photo, cell }) => (
              <Photo key={photo.src} photo={photo} className={cn("h-full w-full", cell)} />
            ))}
          </div>
        </>
      ),
    },
    /* What the community said */
    {
      tone: "light",
      body: (
        <>
          <Eyebrow tone="light">What the community said</Eyebrow>
          <Title>
            The response
            <br /> was <Accent>strong.</Accent>
          </Title>
          <div className="mt-9 flex items-center gap-12 rounded-2xl bg-black px-12 py-12 text-white">
            <div>
              <p className="font-display text-[170px] font-bold leading-[0.82] tracking-tight text-magenta">65</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest">Net Promoter Score</p>
            </div>
            <div className="flex-1">
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="bg-magenta" style={{ width: `${NPS_SPLIT[0]}%` }} />
                <div className="bg-magenta/40" style={{ width: `${NPS_SPLIT[1]}%` }} />
                <div className="bg-white/25" style={{ width: `${NPS_SPLIT[2]}%` }} />
              </div>
              <p className="mt-5 text-section leading-relaxed text-white/70">
                75% promoters · 15% passives · 10% detractors. Anything above 50 is considered excellent. SASTW
                landed well above that.
              </p>
            </div>
          </div>
          <div className="mt-6 grid flex-1 grid-cols-2 grid-rows-2 border-l border-t border-black/10">
            {RESPONSE_STATS.map((s) => (
              <div key={s.label} className="flex flex-col justify-between border-b border-r border-black/10 p-6">
                <p className={cn("font-display text-[64px] font-bold leading-none tracking-tight tabular-nums", s.accent && "text-magenta")}>
                  {s.value}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },
    /* What stuck with attendees — its own page, in the web page's three tiers */
    {
      tone: "light",
      body: (
        <>
          <Eyebrow tone="light">What stuck with attendees</Eyebrow>
          <div className="mt-5 grid h-110 grid-cols-2 gap-3">
            {FEATURED_QUOTES.map((f) => {
              const [before, accent, after] = splitAccent(f.quote, f.accent);
              return (
                <figure key={f.quote} className="relative isolate flex items-end overflow-hidden rounded-xl bg-black p-6 text-white">
                  <Image
                    src={f.photo.src}
                    alt={f.photo.alt}
                    fill
                    unoptimized
                    loading="eager"
                    className="-z-10 object-cover"
                    style={{ objectPosition: f.pos }}
                  />
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-black via-black/45 via-35% to-transparent to-75%" />
                  <blockquote className="font-display text-[30px] font-bold uppercase leading-[1.02] tracking-tight indent-[-0.3em]">
                    {before}
                    <span className="text-magenta">{accent}</span>
                    {after}
                  </blockquote>
                </figure>
              );
            })}
          </div>
          <div className="mt-3 grid h-53.75 grid-cols-2 gap-3">
            {PHOTO_QUOTES.map((q) => (
              <figure key={q.quote} className="grid grid-cols-[2fr_3fr] overflow-hidden rounded-xl border border-black/10 bg-muted">
                <span className="relative block">
                  <Image
                    src={q.photo.src}
                    alt={q.photo.alt}
                    fill
                    unoptimized
                    loading="eager"
                    className="object-cover"
                    style={{ objectPosition: q.pos }}
                  />
                </span>
                <blockquote className="self-center px-5 text-[13.5px] leading-relaxed text-black/80 indent-[-0.4em]">
                  {q.quote}
                </blockquote>
              </figure>
            ))}
          </div>
          <div className="mt-3 grid flex-1 grid-cols-2 gap-3">
            {PLAIN_QUOTES.map((q) => (
              <figure key={q} className="flex items-center rounded-xl border border-black/10 border-l-4 border-l-magenta bg-muted px-7">
                <blockquote className="text-[15.5px] leading-relaxed text-black/80 indent-[-0.4em]">{q}</blockquote>
              </figure>
            ))}
          </div>
        </>
      ),
    },
    /* Reach beyond the room */
    {
      tone: "dark",
      body: (
        <>
          <Eyebrow tone="dark">Reach beyond the room</Eyebrow>
          <Title>
            The current ran
            <br /> <Accent>wider than the week.</Accent>
          </Title>
          <Lede tone="dark">
            Email, Instagram, and LinkedIn carried the story across the summer and into October. Sponsors sat inside
            every touchpoint.
          </Lede>
          <div className="mt-9 grid grid-cols-3 border-l border-t border-white/10">
            {CHANNELS.map((ch) => (
              <div key={ch.name} className="border-b border-r border-white/10 px-5 py-6">
                <Eyebrow tone="dark">{ch.name}</Eyebrow>
                <dl className="mt-3">
                  {ch.rows.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-2 border-b border-white/10 py-3.75 last:border-b-0">
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-white/55">{label}</dt>
                      <dd className="font-display text-[27px] font-bold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <Callout eyebrow="Combined reach" figure="~45,000" rest="unique touches">
            Across email, Instagram, LinkedIn, in-person attendance, and the full registered audience. The LinkedIn
            engagement rate of 12.5% is more than double the industry average.
          </Callout>
        </>
      ),
    },
    /* Press coverage */
    {
      tone: "light",
      body: (
        <>
          <Eyebrow tone="light">Press coverage</Eyebrow>
          <Title>
            The story
            <br /> <Accent>traveled.</Accent>
          </Title>
          <Lede tone="light">
            Broadcast, digital, and national syndication picked up SASTW across the week. Media partners KENS 5, KSAT
            12, and TPR drove the local story. Yahoo News amplified it nationally.
          </Lede>
          <div className="mt-9 grid grid-cols-3 border-l border-t border-black/10">
            {PRESS.map((g) => (
              <div key={g.name} className="border-b border-r border-black/10 px-5 py-6">
                <Eyebrow tone="light">{g.name}</Eyebrow>
                <div className="mt-4 space-y-4">
                  {g.items.map((it) => (
                    <p key={it.outlet} className="text-[13.5px] leading-relaxed text-black/65">
                      <strong className="font-semibold text-black">{it.outlet}</strong>
                      {it.text.startsWith("and ") ? " " : " — "}
                      {it.text}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Callout eyebrow="Capital deployed on stage" figure="$110,000" rest="in pitch funding">
            Deployed live during Latin Tech Pitch and Mission Pitch at Texas Public Radio. Press coverage named these
            as marquee capital moments of the week.
          </Callout>
        </>
      ),
    },
    /* Where sponsors showed up — the Founder circuit under the section head */
    {
      tone: "dark",
      body: (
        <>
          <Eyebrow tone="dark">Where sponsors showed up</Eyebrow>
          <Title>
            Your brand
            <br /> <Accent>plugged in.</Accent>
          </Title>
          <Lede tone="dark">
            Every sponsor had a named place in the week — on stage, in the room, in the inbox, and across every channel
            that carried the story.
          </Lede>
          <Photo photo={founder.photo} className="mt-8 aspect-3/2 w-full rounded-xl" />
          <Spotlight circuit={founder.circuit} caption={founder.caption} sponsors={sponsors} className="mt-6" />
        </>
      ),
    },
    /* The other two circuits, side by side — both photos stand tall */
    {
      tone: "dark",
      body: (
        <div className="grid flex-1 grid-cols-2 gap-8">
          {otherSpotlights.map((s) => (
            <div key={s.circuit} className="flex flex-col">
              <Photo photo={s.photo} className="aspect-2/3 w-full rounded-xl" />
              <Spotlight circuit={s.circuit} caption={s.caption} sponsors={sponsors} className="mt-6" />
            </div>
          ))}
        </div>
      ),
    },
    /* Who powered what */
    {
      tone: "dark",
      body: (
        <>
          <Eyebrow tone="dark">Where sponsors showed up</Eyebrow>
          <div className="mt-6 flex flex-1 flex-col gap-3">
            {POWERING.map((band) => (
              <div key={band.title} className="flex flex-1 items-center gap-6 rounded-xl border border-white/10 bg-white/4 px-7">
                <p className="w-70 shrink-0 text-balance font-display text-heading font-bold uppercase leading-[0.98] tracking-tight">
                  <span className="block font-mono text-[9.5px] font-normal tracking-widest text-magenta">{band.lead}</span>
                  <span className="mt-2 block">{band.title}</span>
                </p>
                <div className="flex flex-1 flex-wrap items-center justify-end gap-x-7 gap-y-4">
                  {band.orgs.map((name) => {
                    const row = orgRow(name);
                    return row?.imageUrl ? (
                      <Mark key={name} src={sponsorMark(row.name, row.imageUrl)} alt={row.name} className="h-10 w-26" />
                    ) : (
                      <span key={name} className="font-display text-body font-bold uppercase text-white/85">
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    },
    /* Already plugged in */
    {
      tone: "dark",
      body: (
        <>
          <Eyebrow tone="dark">Already plugged in</Eyebrow>
          <Title>
            The full
            <br /> <Accent>backing roster.</Accent>
          </Title>
          <Lede tone="dark">
            A thank you to every organization that powered the current this year — financially, operationally, and
            in community.
          </Lede>
          {/* Sixteen marks, centred in the page rather than stacked at the
              top of it. */}
          <div className="flex flex-1 flex-col justify-center">
            <div className="grid grid-cols-4 gap-x-9 gap-y-12">
              {rosterSponsors.map((s) => (
                <Mark key={s.id} src={sponsorMark(s.name, s.imageUrl)} alt={s.name} className="h-20 w-full" />
              ))}
            </div>
            <div className="mt-12 grid grid-cols-4 gap-x-9 gap-y-11 border-t border-white/10 pt-12">
              {rosterPartners.map((p) => (
                <Mark key={p.id} src={sponsorMark(p.name, p.imageUrl)} alt={p.name} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </>
      ),
    },
    /* What you enabled */
    {
      tone: "light",
      body: (
        <>
          <Eyebrow tone="light">What you enabled</Eyebrow>
          <Title className="text-[56px] leading-[0.92]">
            This week
            <br /> doesn&apos;t happen
            <br /> <Accent>without you.</Accent>
          </Title>
          <div className="mt-12 grid flex-1 grid-cols-2 gap-x-10 gap-y-8">
            {IMPACT.map((it) => (
              <div key={it.label} className="border-t-2 border-magenta pt-5">
                <p className="font-display text-[72px] font-bold leading-none tracking-tight tabular-nums text-magenta">{it.value}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest">{it.label}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-black/60">{it.sub}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },
    /* See you in 2027 */
    {
      tone: "pink",
      className: "items-center justify-center text-center",
      body: (
        <>
          <p className="font-mono text-[11px] uppercase tracking-widest text-black/70">See you in 2027</p>
          <h2 className="mt-6 font-display text-[84px] font-bold uppercase leading-[0.88] tracking-tight">
            Thank you
            <br /> for plugging in.
          </h2>
          <p className="mt-8 max-w-120 text-body leading-relaxed text-black/80">
            The current ran through SA this year because you helped power it. We&apos;d love to build what&apos;s next
            with you.
          </p>
          <p className="mt-12 font-display text-heading font-bold uppercase tracking-wide">Leslie Chasnoff</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-black/70">
            Director of Programs &amp; Partnerships · Geekdom
          </p>
          <a
            href="mailto:lesliechasnoff@geekdom.com"
            className="mt-7 inline-flex h-12 items-center rounded-md bg-black px-7 text-[17px] font-medium text-white"
          >
            lesliechasnoff@geekdom.com
          </a>
        </>
      ),
    },
  ];
  const total = pages.length + 1;

  return (
    <main className="report-print [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
      {/* Letter, no margins: every sheet is drawn full-bleed and carries its
          own. On screen the sheets stack on grey, so the layout can be
          checked page by page before the PDF is saved. */}
      <style>{`
        @page { size: letter; margin: 0; }
        .report-print { background: #3f3f46; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 0; }
        @media print {
          .report-print { background: none; gap: 0; padding: 0; }
          .report-print .sheet { break-after: page; }
        }
      `}</style>

      {/* ─── Cover ─── */}
      <Sheet tone="dark" total={total} className="relative">
        <div aria-hidden="true" className="absolute -right-24 top-40 h-140 w-140 opacity-90">
          <Image src="/brand/bolt-current-og.png" alt="" fill sizes="560px" loading="eager" className="object-contain" />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "radial-gradient(60% 45% at 80% 45%, rgba(255,50,160,0.22), transparent 70%)" }}
        />
        <div className="relative flex items-center justify-between">
          <Image src="/brand/sastw-horizontal-white.png" width={1600} height={400} alt="SASTW" loading="eager" className="h-9 w-auto" />
          <p className="font-mono text-[11px] uppercase tracking-widest text-magenta">2026 Sponsor Report</p>
        </div>
        <div className="relative mt-auto">
          <p className="font-mono text-[11px] uppercase tracking-widest text-magenta">
            San Antonio Startup + Tech Week · Sept 28 – Oct 2, 2026
          </p>
          <h1 className="mt-6 font-display text-[84px] font-bold uppercase leading-[0.88] tracking-tight">
            You helped make
            <br /> the current
            <br /> <Accent>run through SA.</Accent>
          </h1>
          <p className="mt-7 max-w-130 text-[17px] leading-relaxed text-white/75">
            Here&apos;s what the week looked like, what the community said, and where your support showed up.
          </p>
        </div>
        <div className="relative mt-14 flex items-center justify-between border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-widest text-white/50">
          <p>sasw.co</p>
          <p>Prepared November 2026</p>
        </div>
      </Sheet>

      {pages.map((p, i) => (
        <Sheet key={i} tone={p.tone} n={i + 2} total={total} className={p.className}>
          {p.body}
        </Sheet>
      ))}
    </main>
  );
}

/** A circuit's credit: its name, the sponsor's mark, and the photo's caption. */
function Spotlight({
  circuit,
  caption,
  sponsors,
  className,
}: {
  circuit: (typeof SPOTLIGHTS)[number]["circuit"];
  caption: string;
  sponsors: LogoEntityRow[];
  className?: string;
}) {
  const sponsor = circuitSponsor(circuit, sponsors);
  return (
    <div className={className}>
      <p className="font-display text-[30px] font-bold uppercase leading-[0.95] tracking-tight">
        {circuit} <Accent>Circuit</Accent>
      </p>
      <p className="mt-4 font-mono text-[9.5px] uppercase tracking-widest text-white/50">presented by</p>
      {sponsor && (
        <Mark
          src={sponsor.imageUrl}
          alt={sponsor.name}
          left
          className={cn("mt-3", sponsor.name === "Webhead" ? "h-14 w-50" : "h-9 w-55")}
        />
      )}
      <p className="mt-5 flex items-start gap-3 font-mono text-[9.5px] uppercase leading-relaxed tracking-widest text-white/60">
        <span aria-hidden="true" className="mt-1.5 h-px w-5 shrink-0 bg-magenta" />
        {caption}
      </p>
    </div>
  );
}
