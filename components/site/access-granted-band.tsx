import Image from "next/image";
import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { OrganizerLogo } from "@/components/site/organizer-logo";
import { ButtonLink } from "@/components/ui/button";
import { ARROW_MOTION } from "@/lib/motion";
import {
  ACCESS_BADGES,
  ACCESS_GRANTED,
  ACCESS_GREEN,
  ACCESS_ORGANIZERS,
  GRID_FADE,
  GRID_LINE,
  ACCESS_TRACKS,
} from "@/lib/access-granted";
import { cn } from "@/lib/utils";

// Access Granted's band — on /schedule as a teaser, on its own page as the
// masthead. The same two jobs PysaBand does, and deliberately the same shape:
// heading, blurb, event info, who runs it, one button, all in a single column
// beside the art. No rule between them, because it is one statement.
//
// The brand is carried by the green and by terminal grammar: `>_` before the
// machine-ish labels, mono caps for anything that reads as data. Restrained on
// purpose — the spec's own warning was that this must not look like a 1990s
// movie poster, so the green marks the prompts, the one-liner's rule, the
// bullets and the badges, and nothing else.
//
// Site black as the ground, not the spec's #0F1115: a second near-black on a
// site whose sections are otherwise pure black reads as drift. PySA's band
// already learned that and moved. See lib/access-granted.ts.

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-widest text-white/55">
      <span aria-hidden="true" style={{ color: ACCESS_GREEN }}>
        {">_ "}
      </span>
      {children}
    </p>
  );
}

const META = [
  { Icon: CalendarDays, label: "Date", value: ACCESS_GRANTED.dateLabel },
  { Icon: Clock, label: "Time", value: ACCESS_GRANTED.timeLabel },
  {
    Icon: MapPin,
    label: "Where",
    value: `${ACCESS_GRANTED.venue}, ${ACCESS_GRANTED.venueDetail}`,
  },
];

export function AccessGrantedBand({
  detailHref,
  scheduleHref,
  actions,
  masthead = false,
}: {
  /** Omitted on the activation's own page, where it would link to itself. */
  detailHref?: string;
  /**
   * A second way out, for the homepage: this band is the front door's one
   * event, so it should also open onto the week it belongs to rather than
   * dead-ending at a single activation.
   */
  scheduleHref?: string;
  /** Register + calendar, for the band's own page. */
  actions?: React.ReactNode;
  masthead?: boolean;
} = {}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-black",
        // A seam when this is a section among others. The gap either side of
        // it is 240px, the same as the gap to the sponsor wall below — but
        // that one has a rule and this one didn't, so the same distance read
        // as a hole rather than a boundary. Not as a masthead, where the back
        // link above already draws one.
        !masthead && "border-t border-white/10",
        // Full-viewport as a masthead — the measure every other hero here
        // uses. Not as a mid-page band, where it would shove the rest of
        // /schedule off-screen.
        masthead && "flex min-h-[calc(100vh-4rem)] flex-col justify-center",
      )}
    >
      <div
        className={cn(
          "relative z-20 mx-auto w-full max-w-7xl px-6 pb-20 lg:pb-28",
          masthead ? "pt-6 lg:pt-7" : "pt-20 lg:pt-28",
        )}
      >
        {/*
          `auto` for the copy column, not `1fr`.

          With `1fr` the column took the whole row while the copy inside it
          capped at max-w-2xl, so the 144px of leftover sat between the text
          and the art on top of the gap — an effective 240px trench. Sized to
          its content, the gap is only the gap.

          The lock is a column rather than an absolute overlay: positioned
          absolutely it bled down over everything beneath it. The photograph
          heroes get away with that because they are masked and scrimmed into
          the black; this one has its own glow and a hard silhouette.
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12 xl:gap-16">
          <div className="contents lg:block lg:max-w-xl xl:max-w-2xl">
            <div className="order-1">
              <Prompt>The Rand · Tech &amp; Builders</Prompt>
            </div>

            <h2 className="order-2 mt-3 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl">
              {ACCESS_GRANTED.name}
            </h2>

            {/* A rule rather than the spec's filled green panel — a solid
                block of #00ff66 at this size shouts, and the spec itself asked
                for the green to stay sparing. */}
            <p
              className="order-3 mt-5 border-l-2 pl-5 text-pretty text-lg text-white/80"
              style={{ borderColor: ACCESS_GREEN }}
            >
              {ACCESS_GRANTED.oneLiner.setup}{" "}
              {/* Desktop-only. `hidden` below lg leaves the space above it
                  intact, so the two halves read as one sentence on a narrow
                  column; from lg the space collapses against the break and
                  costs nothing. Same trick the bento titles use. */}
              <br className="hidden lg:inline" />
              {ACCESS_GRANTED.oneLiner.turn}
            </p>

            <dl className="order-5 mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
              {META.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <dt className="sr-only">{label}</dt>
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: ACCESS_GREEN }}
                    aria-hidden="true"
                  />
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            {/* Detail, not teaser — like the running order below. */}
            {masthead && (
              <ul className="order-6 mt-5 flex flex-wrap gap-2">
                {ACCESS_BADGES.map((b) => (
                  <li
                    key={b}
                    className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest"
                    style={{
                      borderColor: `${ACCESS_GREEN}59`,
                      color: ACCESS_GREEN,
                    }}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {/* In the column, not below the grid. Below it they were stranded
                under a much taller art column, which left a ~270px hole once
                the dividing rule came out. */}
            <div className="order-8 mt-9">
              <Prompt>Powered by</Prompt>
              {/* Three across on phones. As a flex-wrap this ran 4 + 1 from
                  414px up — every Pro-sized handset — widowing the last mark.
                  A fixed three keeps the rows even; sm and up it goes back to
                  flowing on one line. */}
              <ul className="mt-4 grid grid-cols-3 items-center justify-items-start gap-x-6 gap-y-7 sm:flex sm:flex-wrap sm:gap-x-9 sm:gap-y-6">
                {ACCESS_ORGANIZERS.map((o) => (
                  <li key={o.name}>
                    <OrganizerLogo org={o} />
                  </li>
                ))}
              </ul>
            </div>

            {actions && <div className="order-9 mt-9">{actions}</div>}

            {(detailHref || scheduleHref) && (
              <div className="order-10 mt-12 flex flex-wrap items-center gap-3">
                {detailHref && (
                  <ButtonLink
                    href={detailHref}
                    size="md"
                    className="group bg-white/10 text-white duration-200 hover:bg-white/20"
                  >
                    Full event details
                    <ArrowUpRight
                      className={cn(
                        ARROW_MOTION,
                        "h-4 w-4 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                      )}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </ButtonLink>
                )}
                {/* Outlined against the filled one, so the pair reads as a
                    primary and a way past it rather than two equals — the
                    house rule is one primary action per section. */}
                {scheduleHref && (
                  <ButtonLink
                    href={scheduleHref}
                    size="md"
                    className="group border border-white/20 bg-transparent text-white duration-200 hover:bg-white/10"
                  >
                    See the full week
                    <ArrowUpRight
                      className={cn(
                        ARROW_MOTION,
                        "h-4 w-4 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                      )}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </ButtonLink>
                )}
              </div>
            )}
          </div>

          {/* Sized against the copy, not the row. At 26rem the render stood
              629px tall next to a 444px block of text — 1.42x it — and read as
              the subject with the copy as a caption. 22rem brings it roughly
              level with the taller of the two arrangements. */}
          {/*
            Three layers, so the render sits *in* something rather than on it.

            A transparent PNG with a hard silhouette can't be dissolved into
            the black the way the photograph heroes are — masking it would cut
            the object. What it can have is an environment, and the artwork
            supplies the logic: it is already emitting green light, so the
            honest move is to let that light land on something.

              · a schematic grid, faint and radially masked, giving the glow a
                surface to fall on. The brand spec asks for exactly this —
                "subtle dotted or lined patterns", HUD rather than poster.
              · the lock's own spill, centred on the body rather than parked
                beside it, which is where the old section-level bloom sat and
                why it read as unrelated atmosphere.
              · a contact shadow under the body — the one cue that says an
                object has weight and is resting on something.

            On mobile too — the grid is what stops the render reading as a
            sticker there as much as anywhere, and the art keeps its own row
            between the one-liner and the event details.

            Both layers reach left, past the art and under the copy, rather
            than being a halo around the object. An ellipse centred at 68% of
            a box that extends 150% to the left — centred on the box it would
            sit in empty space instead of on the lock.

            Pushed to the far right of its column from lg (`ml-auto`) rather
            than sitting against the copy. That opens a wide gap, which the
            schematic grid is what makes tolerable — it fills the span with
            surface instead of void, so the lock reads as sitting further back
            in the same space rather than marooned. Its right edge lands on the
            container's content edge, under the navbar's links.
          */}
          <div className="relative order-4 mx-auto my-10 w-40 sm:w-48 lg:order-none lg:mr-0 lg:ml-auto lg:my-0 lg:w-72 xl:w-[22rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-y-[45%] -left-[150%] -right-[45%]"
              style={{
                backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`,
                backgroundSize: "34px 34px",
                maskImage: GRID_FADE,
                WebkitMaskImage: GRID_FADE,
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-y-[28%] -left-[110%] -right-[28%] blur-[70px]"
              style={{
                background: `radial-gradient(ellipse 52% 62% at 70% 58%, ${ACCESS_GREEN}4d 0%, transparent 68%)`,
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[12%] bottom-[3%] h-8 rounded-[50%] blur-[26px]"
              style={{ background: `${ACCESS_GREEN}33` }}
            />
            <Image
              src={ACCESS_GRANTED.lock}
              alt=""
              width={ACCESS_GRANTED.lockWidth}
              height={ACCESS_GRANTED.lockHeight}
              priority={masthead}
              sizes="(min-width: 1280px) 352px, (min-width: 1024px) 288px, 192px"
              className="relative h-auto w-full"
            />
          </div>
        </div>

        {/* The running order is detail, not a teaser. On /schedule the band
            keeps PySanAntonio's shape and the two columns live on the
            activation's own page, where someone has already decided to look.
            This rule stays: it divides the hero from the programme, which is a
            real boundary, unlike the one that used to cut the hero in half. */}
        {masthead && (
          <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:gap-14">
            {ACCESS_TRACKS.map((t) => (
              <div key={t.label}>
                <Prompt>{t.label}</Prompt>
                <ul className="mt-4 space-y-2.5">
                  {t.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-pretty text-white/80"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-1 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: ACCESS_GREEN }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-3.5 max-w-sm text-pretty text-sm text-white/50">
                  {t.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
