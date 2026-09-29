import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { EVENT_DAYS } from "@/lib/event";
import { liveSchedule } from "@/lib/live-schedule";
import { venueGetThere } from "@/lib/locations";
import { dayCalendar, type CalendarItem } from "@/lib/schedule";

// A day's schedule as one tall, branded image — the thing a phone keeps.
//
// Why an image and not a PDF: on a phone an image is one long-press from the
// camera roll ("Save to Photos" on iPhone, "Download image" on Android), opens
// with no signal inside a building, and texts to a friend as it is. The
// printable version for a desk is /schedule/day/<iso>/print.
//
// `?venue=<slug>` narrows it to one room — the day page passes whatever room
// filter the visitor has set. Otherwise every room, grouped by room: on site
// the question is "what's next in this building", and a single mixed timeline
// would make the reader work out the room for every row.
//
// Rendered per request from the live schedule, so a saved copy is as fresh as
// the moment it was saved — and it says so at the foot, with the address of
// the live page for anything that moves after.

export const dynamic = "force-dynamic";

const W = 1080;
const PAD = 72;
const MAGENTA = "#ff32a0";
const TZ = "America/Chicago";

// Fonts are vendored under public/brand (see lib/og.tsx for why never
// node_modules). Oswald for display, Geist for reading, Geist Mono for times.
async function fonts() {
  const read = (f: string) => readFile(join(process.cwd(), "public/brand", f));
  const [oswald, geist, geistSemi, mono] = await Promise.all([
    read("oswald-700-latin.woff"),
    read("geist-400.ttf"),
    read("geist-600.ttf"),
    read("geist-mono-500.ttf"),
  ]);
  return [
    { name: "Oswald", data: oswald, weight: 700 as const, style: "normal" as const },
    { name: "Geist", data: geist, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: geistSemi, weight: 600 as const, style: "normal" as const },
    { name: "GeistMono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

/** Roughly how many lines a title takes at 34px across the title column. */
function titleLines(text: string): number {
  return Math.min(3, Math.ceil(text.length / 38));
}

function rowHeight(i: CalendarItem): number {
  const t = titleLines(i.longTitle || i.title) * 42;
  const people = i.people ? 36 : 0;
  const note = i.cancelled || i.changeNote ? 30 : 0;
  return 46 + t + people + note;
}

export async function GET(req: Request, ctx: { params: Promise<{ iso: string }> }) {
  const { iso } = await ctx.params;
  const venue = new URL(req.url).searchParams.get("venue");
  if (!EVENT_DAYS.some((d) => d.iso === iso)) return new Response("Not found", { status: 404 });

  const live = await liveSchedule();
  const data = dayCalendar(iso, live.items, live.attached);
  if (!data) return new Response("Not found", { status: 404 });
  const where = venueGetThere();

  const venues = data.venues
    .filter((v) => !venue || v.slug === venue)
    .map((v) => ({
      ...v,
      items: data.items.filter((i) => i.venueSlug === v.slug).sort((a, b) => a.startMin - b.startMin),
      spans: data.spans.filter((s) => s.venueSlug === v.slug),
    }))
    .filter((v) => v.items.length || v.spans.length);

  const index = EVENT_DAYS.findIndex((d) => d.iso === iso);
  const updated = new Date().toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  const single = venue ? venues[0] : null;

  // Estimated rather than measured (the renderer lays out once, at a size
  // given up front), and erring a little long: short leaves a strip of black
  // under the foot, where too short would clip the last room.
  const HEAD = 420;
  const FOOT = 200;
  const height =
    HEAD +
    FOOT +
    venues.reduce(
      (h, v) => h + 150 + v.spans.length * 84 + v.items.reduce((s, i) => s + rowHeight(i), 0),
      0,
    ) +
    (venues.length ? 0 : 160);

  const lockup = await readFile(join(process.cwd(), "public/brand/sastw-horizontal-white.png"));
  const lockupSrc = `data:image/png;base64,${lockup.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#000000",
          color: "#ffffff",
          padding: `${PAD}px ${PAD}px 0 ${PAD}px`,
          fontFamily: "Geist",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lockupSrc} height={56} style={{ height: 56 }} alt="" />
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 24, letterSpacing: 3, color: "rgba(255,255,255,0.6)" }}>
            SEPT 28 – OCT 2, 2026
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 72, fontFamily: "GeistMono", fontSize: 26, letterSpacing: 4, color: MAGENTA }}>
          {`DAY ${index + 1} OF ${EVENT_DAYS.length} · ${data.day.label.toUpperCase()}`}
        </div>
        <div style={{ display: "flex", marginTop: 12, fontFamily: "Oswald", fontSize: 150, lineHeight: 0.95, textTransform: "uppercase" }}>
          {`${data.day.weekday}.`}
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: "rgba(255,255,255,0.7)" }}>
          {single
            ? `${single.name}${where[single.slug]?.floor ? `, ${where[single.slug]?.floor}` : ""}`
            : `${venues.length} ${venues.length === 1 ? "room" : "rooms"} · every session, room by room`}
        </div>

        {venues.length === 0 && (
          <div style={{ display: "flex", marginTop: 80, fontSize: 36, color: "rgba(255,255,255,0.7)" }}>
            Nothing on the schedule here this day.
          </div>
        )}

        {/* Rooms */}
        {venues.map((v) => {
          const w = where[v.slug];
          return (
            <div key={v.slug} style={{ display: "flex", flexDirection: "column", marginTop: 64 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: `4px solid ${MAGENTA}`, paddingBottom: 14 }}>
                <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 60, textTransform: "uppercase", lineHeight: 1 }}>
                  {v.name}
                </div>
                <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 22, letterSpacing: 2, color: "rgba(255,255,255,0.6)" }}>
                  {[w?.floor, w?.address].filter(Boolean).join(" · ").toUpperCase()}
                </div>
              </div>

              {v.spans.map((s) => (
                <div key={s.slug} style={{ display: "flex", alignItems: "baseline", paddingTop: 22, paddingBottom: 22, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
                  <div style={{ display: "flex", width: 230, fontFamily: "GeistMono", fontSize: 26, color: MAGENTA }}>ALL DAY</div>
                  <div style={{ display: "flex", flex: 1, fontSize: 34, fontWeight: 600 }}>{s.title}</div>
                </div>
              ))}

              {v.items.map((i) => (
                <div
                  key={i.slug}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    paddingTop: 22,
                    paddingBottom: 22,
                    borderBottom: "1px solid rgba(255,255,255,0.14)",
                    opacity: i.cancelled ? 0.55 : 1,
                  }}
                >
                  <div style={{ display: "flex", width: 230, paddingTop: 6, fontFamily: "GeistMono", fontSize: 26, color: MAGENTA }}>
                    {i.timeLabel.toUpperCase()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    {(i.cancelled || i.changeNote) && (
                      <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 20, letterSpacing: 2, color: MAGENTA, marginBottom: 6 }}>
                        {`${i.cancelled ? "CANCELED" : "CHANGED"}${i.changeNote ? ` · ${i.changeNote}` : ""}`}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        fontSize: 34,
                        fontWeight: 600,
                        lineHeight: 1.22,
                        textDecoration: i.cancelled ? "line-through" : "none",
                      }}
                    >
                      {i.longTitle || i.title}
                    </div>
                    {i.people && (
                      <div style={{ display: "flex", marginTop: 6, fontSize: 24, color: "rgba(255,255,255,0.62)" }}>{i.people}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Foot: when this copy was made, and where the live one is. */}
        <div style={{ display: "flex", flexDirection: "column", paddingTop: 56, paddingBottom: 64 }}>
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 22, letterSpacing: 2, color: "rgba(255,255,255,0.5)" }}>
            {`SAVED ${updated.toUpperCase()} · TIMES CAN CHANGE`}
          </div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 30, color: "#ffffff" }}>
            <span style={{ color: MAGENTA, marginRight: 12 }}>Live schedule</span>
            {`sasw.co/schedule/day/${iso}`}
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: Math.max(1350, height),
      fonts: await fonts(),
      headers: {
        // A saved copy is a snapshot anyway; a minute of cache spares the
        // render when a room full of people taps Save at once.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "Content-Disposition": `inline; filename="sastw-${data.day.weekday.toLowerCase()}${single ? `-${single.slug}` : ""}.png"`,
      },
    },
  );
}
