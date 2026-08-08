import Image from "next/image";
import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ARROW_MOTION } from "@/lib/motion";
import {
  ACCESS_BADGES,
  ACCESS_GRANTED,
  ACCESS_GREEN,
  ACCESS_ORGANIZERS,
  ACCESS_TRACKS,
} from "@/lib/access-granted";
import { cn } from "@/lib/utils";

// Access Granted's band — on /schedule as a teaser, on its own page as the
// masthead. The same two jobs PysaBand does, and deliberately the same shape,
// so the two banded activations read as siblings rather than as two designs.
//
// The brand is carried by the green and by terminal grammar: `>_` before the
// machine-ish labels, mono caps for anything that reads as data, hairline
// rules standing in for a HUD. Restrained on purpose — the spec's own warning
// was that this must not look like a 1990s movie poster, so the green marks
// the prompts, the one-liner's rule, the bullets and the badges, and nothing
// else.
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
  actions,
  masthead = false,
}: {
  /** Omitted on the activation's own page, where it would link to itself. */
  detailHref?: string;
  /** Register + calendar, for the band's own page. */
  actions?: React.ReactNode;
  masthead?: boolean;
} = {}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-black",
        // Full-viewport as a masthead — the measure every other hero here
        // uses. Not as a mid-page band, where it would shove the rest of
        // /schedule off-screen.
        masthead && "flex min-h-[calc(100vh-4rem)] flex-col justify-center",
      )}
    >
      {/* Green bloom behind the lock, the counterpart to PySA's blue one —
          anchored left now that the art is, or it would glow at empty space on
          the far side of the copy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/4 hidden h-140 w-140 rounded-full opacity-20 blur-[120px] sm:block"
        style={{
          background: `radial-gradient(circle, ${ACCESS_GREEN} 0%, transparent 65%)`,
        }}
      />

      <div
        className={cn(
          "relative z-20 mx-auto w-full max-w-7xl px-6 pb-20 lg:pb-28",
          masthead ? "pt-8 lg:pt-10" : "pt-20 lg:pt-28",
        )}
      >
        {/*
          The lock is a grid column, not an absolute overlay.

          Positioned absolutely it bled down over the track lists — a product
          render with a hard edge sitting behind body copy. The photograph
          heroes get away with that only because they are masked and scrimmed
          into the black; this one carries its own glow and a defined
          silhouette, so it wants to sit beside the copy, not behind it.
        */}
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-16">
          <div className="max-w-xl lg:order-2 xl:max-w-2xl">
            <Prompt>The Rand · Tech &amp; Builders</Prompt>

            <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl">
              {ACCESS_GRANTED.name}
            </h2>

            {/* A rule rather than the spec's filled green panel — a solid
                block of #00ff66 at this size shouts, and the spec itself asked
                for the green to stay sparing. */}
            <p
              className="mt-6 border-l-2 pl-5 text-pretty text-lg text-white/80"
              style={{ borderColor: ACCESS_GREEN }}
            >
              {ACCESS_GRANTED.oneLiner}
            </p>

            <dl className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
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

            <ul className="mt-6 flex flex-wrap gap-2">
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

            {/* Directly under the badges, not after the partner wall. This
                band carries a lot below here — two track columns and six orgs
                — and a CTA at the end of all that sat below the fold on a
                laptop, which is the trap PySanAntonio's band already fell
                into once. */}
            {actions && <div className="mt-9">{actions}</div>}
          </div>

          {/* Left of the copy from lg up, via `order` rather than DOM position
              — the same trick room-flow uses to alternate its venue rows.
              Reordering the markup instead would put a decorative image ahead
              of the heading, and on mobile, where the grid collapses to one
              column, it would push the copy below a tall render. */}
          <div className="mx-auto w-44 sm:w-52 lg:order-1 lg:mx-0 lg:w-64 xl:w-72">
            <Image
              src={ACCESS_GRANTED.lock}
              alt=""
              width={ACCESS_GRANTED.lockWidth}
              height={ACCESS_GRANTED.lockHeight}
              priority={masthead}
              sizes="(min-width: 1280px) 288px, (min-width: 1024px) 256px, 208px"
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* What runs for five hours straight, and what runs to a clock. This
            is what someone scans to decide whether to give it an afternoon, so
            it takes the full width rather than the copy column. */}
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

        <div className="mt-12 border-t border-white/10 pt-8">
          <Prompt>Powered by</Prompt>
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/70">
            {ACCESS_ORGANIZERS.map((o, i) => (
              <li key={o.name} className="flex items-center gap-3">
                {/* The full name is the accessible one; the short form is what
                    fits on a wall six orgs wide. */}
                <span className="sr-only">{o.name}</span>
                <span aria-hidden="true">{o.short}</span>
                {i < ACCESS_ORGANIZERS.length - 1 && (
                  <span aria-hidden="true" className="text-white/25">
                    /
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {detailHref && (
          <div className="mt-12">
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
          </div>
        )}
      </div>
    </section>
  );
}
