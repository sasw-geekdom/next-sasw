import "server-only";

import {
  listPartners,
  listSessions,
  listSpeakers,
  listSponsors,
} from "@/lib/admin/cms-queries";
import type {
  LogoEntityRow,
  SessionRow,
  SpeakerRow,
} from "@/lib/admin/cms-types";
import { ACCESS_CONTINUOUS, ACCESS_GRANTED, ACCESS_ORGANIZERS, accessBlockFor } from "@/lib/access-granted";
import { circuitSponsor } from "@/lib/circuit-sponsors";
import { EVENT_DAYS } from "@/lib/event";
import { PYSA_ORGANIZERS } from "@/lib/pysa";
import {
  activationSearchText,
  allSessions,
  dayCalendar,
  standaloneItems,
  type CalendarItem,
} from "@/lib/schedule";
import { THE_MODEL, modelOrganizers } from "@/lib/the-model";
import { CIRCUIT_COLORS, TRACKS, type TrackName } from "@/lib/tracks";

// The data behind /tv — the looping screens for the rooms' TVs.
//
// Everything here is flattened to plain, serialisable props, because the loops
// are client components: they run a clock (Now / Up next) and cycle scenes, so
// the server's job ends at handing them the day. Times go over as epoch ms and
// the client decides what is on now — a page rendered at 12:55 and left on a
// TV all afternoon still moves its "Now" marker at 1:00.
//
// Every CMS read is allowed to fail. A TV that loses Firestore keeps the
// activations that live in code (lib/schedule.ts) and loses only the talks and
// logos the CMS contributes — the same trade `liveSchedule` makes — rather
// than showing an error page on a screen nobody is watching.

/** Geekdom's floor at The Rand: every activation with a TV loop is here. */
const ROOM = "the-rand";
const TZ = "America/Chicago";
/** Central Daylight Time — the whole week sits inside it. */
const OFFSET = "-05:00";

export interface TvPerson {
  name: string;
  role: "speaker" | "moderator";
  title?: string;
  company?: string;
  imageUrl?: string;
}

export interface TvTalk {
  title: string;
  /** The title's head, for one-line rows — see `headOf`. */
  short: string;
  /** The opening of the description, cut at a sentence, for the spotlight. */
  lede: string;
  startsAt: number;
  endsAt: number | null;
  people: TvPerson[];
  /** The group whose hour a talk falls in — Access Granted's running order. */
  by?: string;
}

export interface TvLogo {
  name: string;
  src: string;
  /** Height at 1080p, in the stage's pixels. */
  h: number;
  /** Knock a dark mark out to white. */
  white?: boolean;
}

export type TvMark =
  | { kind: "image"; src: string; width: number; height: number }
  | { kind: "text"; text: string; accent?: string };

export interface TvBlock {
  /** The /tv/<slug> this block owns. */
  slug: string;
  title: string;
  startsAt: number;
  endsAt: number;
  timeLabel: string;
  circuit: string;
  mark: TvMark;
  blurb: string;
  talks: TvTalk[];
  poweredBy: TvLogo[];
}

export interface TvSponsor {
  circuit: string;
  color: string;
  name: string;
  src: string;
  note?: string;
}

export interface TvEventData {
  kind: "event";
  brand: "the-model" | "access-granted" | "pysanantonio";
  dayWord: string;
  dateLabel: string;
  timeLabel: string;
  place: string;
  hook: { setup: string; turn: string };
  talks: TvTalk[];
  /** Access Granted's lockpicking village — on all afternoon. */
  village: { name: string; by: string; note: string; logo: TvLogo } | null;
  organizers: TvLogo[];
  sponsor: TvSponsor | null;
  url: string;
}

export interface TvDayData {
  kind: "day";
  dayWord: string;
  dateLabel: string;
  blocks: TvBlock[];
  sponsors: TvSponsor[];
  url: string;
}

export interface TvGroupData {
  kind: "group";
  dayWord: string;
  dateLabel: string;
  block: TvBlock;
  /** What follows it in the room, for the "Up next here" line. */
  after: TvBlock[];
  sponsor: TvSponsor | null;
  url: string;
}

export interface TvWeekData {
  kind: "week";
  days: {
    iso: string;
    weekday: string;
    label: string;
    items: {
      title: string;
      startsAt: number;
      endsAt: number;
      timeLabel: string;
      venue: string;
      circuit: string;
    }[];
  }[];
  circuits: {
    name: string;
    description: string;
    color: string;
    sponsor: TvSponsor | null;
  }[];
  sponsors: TvLogo[];
  partners: TvLogo[];
  url: string;
}

export type TvData = TvEventData | TvDayData | TvGroupData | TvWeekData;

// ── Small helpers ────────────────────────────────────────────────────────────

async function safe<T>(read: () => Promise<T[]>): Promise<T[]> {
  try {
    return await read();
  } catch {
    return [];
  }
}

/** Epoch ms for a minute-of-day on an event day, in Central time. */
function atMinute(iso: string, min: number): number {
  return Date.parse(`${iso}T00:00:00${OFFSET}`) + min * 60_000;
}

function chicagoDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: TZ });
}

function weekday(iso: string): string {
  return new Date(`${iso}T12:00:00${OFFSET}`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: TZ,
  });
}

function dateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00${OFFSET}`);
  const month = d.toLocaleDateString("en-US", { month: "short", timeZone: TZ });
  const day = d.toLocaleDateString("en-US", { day: "numeric", timeZone: TZ });
  // "Sept", the house spelling, not Intl's "Sep".
  return `${weekday(iso)}, ${month === "Sep" ? "Sept" : month} ${day}`;
}

/**
 * The site sizes marks with Tailwind height classes ("h-12 sm:h-14"). A TV
 * wants the desktop value, at stage scale: the largest h-N, in px, times the
 * factor a 1080p screen read from across a room needs over a laptop.
 */
function tvHeight(heightClass: string, factor = 1.9): number {
  const all = [...heightClass.matchAll(/h-(\d+)/g)].map((m) => Number(m[1]));
  const n = all.length ? Math.max(...all) : 12;
  return Math.round(n * 4 * factor);
}

function people(
  row: SessionRow,
  speakers: Map<string, SpeakerRow>,
): TvPerson[] {
  return row.participants.map((p) => {
    const s = speakers.get(p.speakerId);
    return {
      name: s?.name ?? p.name,
      role: p.role,
      ...(s?.title ? { title: s.title } : {}),
      ...(s?.company ? { company: s.company } : {}),
      ...((s?.imageUrl ?? p.imageUrl) ? { imageUrl: s?.imageUrl ?? p.imageUrl } : {}),
    };
  });
}

/**
 * A title's head: the part before its subtitle. CMS titles run long ("Beyond
 * the Cloud: Building Offline AI Pipelines for…"), and a running order read
 * from across a room needs one line per talk — the social cards were cut the
 * same way by hand. A head too short to stand alone keeps the whole title.
 */
export function headOf(title: string): string {
  // A colon, a spaced dash, an opening parenthesis or a full stop ends it.
  const m = title.match(/^(.{10,}?)(?::\s|\s[—–]\s|\s\(|\.\s)/);
  return (m ? m[1] : title).trim();
}

/** The first sentence or two of a description, up to about 240 characters. */
function ledeOf(description: string): string {
  const text = description.replace(/\s+/g, " ").trim();
  if (text.length <= 240) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > 240) break;
    out += s;
  }
  return (out || text.slice(0, 237).replace(/\s+\S*$/, "") + "…").trim();
}

function talk(row: SessionRow, speakers: Map<string, SpeakerRow>): TvTalk {
  return {
    title: row.title,
    short: headOf(row.title),
    lede: ledeOf(row.description ?? ""),
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    people: people(row, speakers),
  };
}

function sponsorFor(
  circuit: string | null | undefined,
  rows: LogoEntityRow[],
): TvSponsor | null {
  const s = circuitSponsor(circuit, rows);
  if (!s) return null;
  return {
    circuit: s.circuit,
    color: CIRCUIT_COLORS[s.circuit as TrackName] ?? "#ff32a0",
    name: s.name,
    src: s.imageUrl,
    ...(s.note ? { note: s.note } : {}),
  };
}

// ── The events: Monday, Wednesday, Friday ────────────────────────────────────

export const TV_EVENTS = ["the-model", "access-granted", "pysanantonio"] as const;
type TvEventSlug = (typeof TV_EVENTS)[number];

const EVENT_DAY: Record<TvEventSlug, string> = {
  "the-model": "2026-09-28",
  "access-granted": "2026-09-30",
  pysanantonio: "2026-10-02",
};

export async function tvEvent(slug: TvEventSlug): Promise<TvEventData> {
  const [rows, speakerRows, partners, sponsors] = await Promise.all([
    safe(listSessions),
    safe(listSpeakers),
    safe(listPartners),
    safe(listSponsors),
  ]);
  const speakers = new Map(speakerRows.map((s) => [s.id, s]));
  const session = allSessions().find((s) => s.page === slug);
  const iso = EVENT_DAY[slug];

  const talks = rows
    .filter((r) => r.activation === slug && r.startsAt)
    .sort((a, b) => a.startsAt - b.startsAt)
    .map((r) => {
      const t = talk(r, speakers);
      if (slug !== "access-granted") return t;
      const by = accessBlockFor(r.startsAt)?.name;
      return by ? { ...t, by } : t;
    });

  const base = {
    kind: "event" as const,
    brand: slug,
    dayWord: weekday(iso),
    dateLabel: dateLabel(iso),
    place: "The Rand, 3rd Floor",
    talks,
    sponsor: sponsorFor(session?.circuit, sponsors),
    url: `sasw.co/schedule/${slug}`,
  };

  if (slug === "the-model") {
    return {
      ...base,
      timeLabel: "1 – 6 PM",
      hook: THE_MODEL.tagline,
      village: null,
      organizers: modelOrganizers(partners).map((o) => ({
        name: o.name,
        src: o.logo,
        h: tvHeight(o.heightClass, 2.4),
      })),
    };
  }
  if (slug === "access-granted") {
    const village = ACCESS_CONTINUOUS.items[0];
    const locksport = ACCESS_ORGANIZERS.find((o) => o.name === "Alamo City Locksport")!;
    return {
      ...base,
      timeLabel: "1 – 6 PM",
      hook: ACCESS_GRANTED.oneLiner,
      village: {
        name: "Lockpicking Village",
        by: village.by ?? "Alamo City Locksport",
        // ACCESS_CONTINUOUS's note, cut to what reads from across a room.
        note: "A TOOOL affiliate, picking locks in the open. All ages welcome, no experience needed.",
        logo: { name: locksport.name, src: locksport.logo, h: 200 },
      },
      organizers: ACCESS_ORGANIZERS.map((o) => ({
        name: o.name,
        src: o.logo,
        h: tvHeight(o.heightClass, 2.2),
      })),
    };
  }
  return {
    ...base,
    timeLabel: "1 – 6 PM",
    // The band's own line (components/site/pysa-band.tsx), split at its turn.
    hook: {
      setup: "San Antonio’s Python conference is back for a second year.",
      turn: "An afternoon of learning, networking, and community building.",
    },
    village: null,
    organizers: PYSA_ORGANIZERS.map((o) => ({
      name: o.name,
      src: o.logo,
      h: tvHeight(o.heightClass, 2.4),
    })),
  };
}

// ── The community days: Tuesday and Thursday ─────────────────────────────────

export const TV_DAYS: Record<string, string> = {
  tuesday: "2026-09-29",
  thursday: "2026-10-01",
};

async function roomBlocks(iso: string): Promise<{
  blocks: TvBlock[];
  sponsors: LogoEntityRow[];
}> {
  const [rows, speakerRows, sponsors] = await Promise.all([
    safe(listSessions),
    safe(listSpeakers),
    safe(listSponsors),
  ]);
  const speakers = new Map(speakerRows.map((s) => [s.id, s]));
  const featured = new Map(allSessions().map((s) => [s.slug, s]));
  const cal = dayCalendar(iso, standaloneItems(rows), activationSearchText(rows));
  if (!cal) return { blocks: [], sponsors };

  const blocks = cal.items
    .filter((i) => i.venueSlug === ROOM)
    .sort((a, b) => a.startMin - b.startMin)
    .map((item) => block(item, iso, rows, speakers, featured.get(item.slug)));
  return { blocks, sponsors };
}

function block(
  item: CalendarItem,
  iso: string,
  rows: SessionRow[],
  speakers: Map<string, SpeakerRow>,
  session: ReturnType<typeof allSessions>[number] | undefined,
): TvBlock {
  // A standalone CMS talk links to /schedule/talk/<slug>; an activation to its
  // own page. Either way the last segment is the slug the TV page takes.
  const standalone = item.href?.startsWith("/schedule/talk/") ?? false;
  const slug = item.page ?? item.href?.split("/").pop() ?? item.slug;
  const talkRows = standalone
    ? rows.filter((r) => r.slug === slug)
    : rows.filter(
        (r) =>
          r.activation === slug &&
          r.location === ROOM &&
          r.startsAt &&
          chicagoDay(r.startsAt) === iso,
      );

  const lockup = item.brand?.lockup;
  const mark: TvMark = lockup
    ? { kind: "image", src: lockup.src, width: lockup.width, height: lockup.height }
    : item.brand?.wordmark === "college-night"
      ? { kind: "text", text: "College Night", accent: "Night" }
      : { kind: "text", text: headOf(item.title) };

  return {
    slug,
    title: item.longTitle || item.title,
    startsAt: atMinute(iso, item.startMin),
    endsAt: atMinute(iso, item.endMin),
    timeLabel: item.timeLabel,
    circuit: item.circuit,
    mark,
    blurb: session?.blurb ?? "",
    talks: talkRows
      .sort((a, b) => a.startsAt - b.startsAt)
      .map((r) => talk(r, speakers)),
    poweredBy: (session?.detail?.poweredBy ?? []).map((o) => ({
      name: o.name,
      src: o.logo,
      h: tvHeight(o.heightClass, 2),
      ...(o.white ? { white: true } : {}),
    })),
  };
}

export async function tvDay(dayWord: string): Promise<TvDayData | null> {
  const iso = TV_DAYS[dayWord];
  if (!iso) return null;
  const { blocks, sponsors } = await roomBlocks(iso);
  const circuits = [...new Set(blocks.map((b) => b.circuit))];
  return {
    kind: "day",
    dayWord: weekday(iso),
    dateLabel: dateLabel(iso),
    blocks,
    sponsors: circuits
      .map((c) => sponsorFor(c, sponsors))
      .filter((s): s is TvSponsor => s !== null),
    url: `sasw.co/schedule/day/${iso}`,
  };
}

export async function tvGroup(slug: string): Promise<TvGroupData | null> {
  for (const iso of Object.values(TV_DAYS)) {
    const { blocks, sponsors } = await roomBlocks(iso);
    const i = blocks.findIndex((b) => b.slug === slug);
    if (i === -1) continue;
    const b = blocks[i];
    return {
      kind: "group",
      dayWord: weekday(iso),
      dateLabel: dateLabel(iso),
      block: b,
      after: blocks.slice(i + 1),
      sponsor: sponsorFor(b.circuit, sponsors),
      url: `sasw.co/schedule/${slug}`,
    };
  }
  return null;
}

/** Every group with a page of its own, for the index and static params. */
export async function tvGroups(): Promise<
  { slug: string; title: string; dayWord: string; timeLabel: string }[]
> {
  const out = [];
  for (const iso of Object.values(TV_DAYS)) {
    const { blocks } = await roomBlocks(iso);
    for (const b of blocks)
      out.push({ slug: b.slug, title: b.title, dayWord: weekday(iso), timeLabel: b.timeLabel });
  }
  return out;
}

// ── The week ─────────────────────────────────────────────────────────────────

export async function tvWeek(): Promise<TvWeekData> {
  const [rows, partners, sponsors] = await Promise.all([
    safe(listSessions),
    safe(listPartners),
    safe(listSponsors),
  ]);
  const extra = standaloneItems(rows);
  const attached = activationSearchText(rows);
  const logo = (r: LogoEntityRow): TvLogo => ({
    name: r.name,
    src: r.imageUrl,
    h: Math.round(84 * (r.scale ?? 1)),
  });

  return {
    kind: "week",
    days: EVENT_DAYS.map((d) => {
      const cal = dayCalendar(d.iso, extra, attached);
      return {
        iso: d.iso,
        weekday: weekday(d.iso),
        label: dateLabel(d.iso).split(", ")[1],
        items: (cal?.items ?? [])
          .slice()
          .sort((a, b) => a.startMin - b.startMin)
          .map((i) => ({
            title: headOf(i.title),
            startsAt: atMinute(d.iso, i.startMin),
            endsAt: atMinute(d.iso, i.endMin),
            timeLabel: i.timeLabel,
            venue: i.venueShort || i.venueName,
            circuit: i.circuit,
          })),
      };
    }),
    circuits: TRACKS.map((t) => ({
      name: t.name,
      description: t.description,
      color: CIRCUIT_COLORS[t.name],
      sponsor: sponsorFor(t.name, sponsors),
    })),
    sponsors: sponsors.filter((s) => s.imageUrl).map(logo),
    partners: partners.filter((p) => p.imageUrl).map(logo),
    url: "sasw.co/schedule",
  };
}
