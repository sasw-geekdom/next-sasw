import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { ProfileMark, profileLabel } from "@/components/site/profile-mark";
import type { CardSpeaker } from "@/components/site/speaker-card";
import type { SessionRow } from "@/lib/admin/cms-types";
import { SPEAKERS_ANNOUNCED } from "@/lib/speakers";
import { cn } from "@/lib/utils";

// The running order inside an activation, from the CMS.
//
// Sessions have lived in the admin since before this page existed, but they
// only ever surfaced on a speaker's own page — a talk added by an organiser
// appeared nowhere on the schedule. Linking a session to an activation gives
// it somewhere to land, and gives an activation a programme that can be edited
// without a deploy.
//
// Deliberately not the same thing as Access Granted's ACCESS_TRACKS. That
// describes the shape of an afternoon — a lockpicking village, a resume corner
// — which is not a talk with a speaker and does not want a talk's fields.
// These sit alongside it.

/**
 * Where an abstract stops being a line in a running order.
 *
 * Six of PySanAntonio's run to 3,000 characters together and one alone to
 * 1,352 — printed in full they made a list that could not be scanned for what
 * a reader came for, which is what is on and who is giving it. Printed behind
 * a disclosure they made the pinned column beside them jump on every click,
 * which is worse: the thing that moved was not the thing that was clicked.
 *
 * So the long ones are clamped in place and finish on their own page. The
 * number is set just above the longest abstract that already fits the clamp —
 * Python Jeopardy, at 280 — so the rows that read fine whole are left whole,
 * and only the ones that were the problem grow a second link.
 */
const DESC_CLAMP = 300;

const TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  hour: "numeric",
  minute: "2-digit",
});

export function ActivationSessions({
  sessions,
  speakers = [],
  aside,
}: {
  sessions: SessionRow[];
  /**
   * Context to pin beside the running order, from `lg` up.
   *
   * Opt-in, and only PySanAntonio passes one. The default layout puts the
   * heading across the top and the list under it, which is right for an
   * activation whose section is the list — most of these are an hour with one
   * or two talks. PySanAntonio is a six-session afternoon run by two
   * nonprofits, and it had a second problem: the rows cap at a reading measure,
   * so on a wide screen the right half of that section was empty black for
   * 2,000px of scroll.
   *
   * The same pinned-column grammar `ActivationDetail` uses, down to `top-24`
   * clearing the header.
   */
  aside?: React.ReactNode;
  /**
   * Everyone in the CMS, for the join below.
   *
   * A session's participants carry `{ speakerId, name, role }` and nothing
   * else — no portrait, no LinkedIn, and crucially no slug. Passing the roster
   * in is what lets a talk show the person giving it rather than their name in
   * mono caps.
   */
  speakers?: CardSpeaker[];
}) {
  if (sessions.length === 0) return null;

  const byId = new Map(speakers.map((s) => [s.id, s]));

  /**
   * One talk is not a running order.
   *
   * The list below is built for a programme — a time rail down the left, one
   * numbered row per slot, under a heading promising sequence. With a single
   * session it renders a list of one: 10rem of rail holding "2:00 PM", an
   * "in order" heading over nothing to order, and the talk itself demoted to
   * an h3 in the second column.
   *
   * That is the common case, not the edge one. Most activations here are an
   * hour with one speaker; twelve-slot afternoons are the exception. So a
   * single session gets the layout it deserves — its own title as the
   * section's heading, the time as a line of mono above it, and no rail —
   * while two or more keep the list.
   */
  const solo = sessions.length === 1 ? sessions[0] : null;

  if (solo) {
    return (
      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              The talk
            </p>
            <p className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {TIME.format(new Date(solo.startsAt))}
              {solo.endsAt ? ` – ${TIME.format(new Date(solo.endsAt))}` : ""}
            </p>
            {/* The talk's own title carries the section. In the list it is an
                h3 under "What's on, in order"; alone, that heading would be
                a label for a single thing sitting right beneath it.
                
                Linked, like every title in the list branch. This was the last
                session title on the site still rendered as dead text: the
                rule used to be that a session inside an activation had no page
                of its own, and when that changed the list learned about it and
                this branch did not. The one activation currently running a
                single session is The Model, so its talk was the only one you
                could read and not open. */}
            <h2 className="mt-4 text-pretty font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              <Link
                href={`/schedule/talk/${solo.slug}`}
                className="group/solo rounded-sm transition-colors duration-200 hover:text-magenta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magenta"
              >
                {solo.title}
                <ArrowUpRight
                  className="ml-2 inline h-6 w-6 -translate-y-0.5 opacity-45 transition-opacity duration-200 group-hover/solo:opacity-100 sm:h-7 sm:w-7"
                  aria-hidden="true"
                />
              </Link>
            </h2>
            {solo.description && (
              <p className="mt-5 text-pretty text-lg leading-relaxed text-white/70">
                {solo.description}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
              {solo.track && (
                <span className="inline-block rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-magenta">
                  {solo.track}
                </span>
              )}
            </div>
            <People participants={solo.participants} byId={byId} />
          </div>
        </div>
      </section>
    );
  }

  const list = (
    <ol className={cn("flex flex-col", aside ? "mt-8 lg:mt-0" : "mt-10 lg:mt-12")}>
          {sessions.map((s) => (
            <li
              key={s.id}
              className="grid min-w-0 gap-x-8 gap-y-3 border-t border-white/10 py-6 lg:grid-cols-[10rem_1fr]"
            >
              {/* self-start from lg: the grid cell stretches to the row, and a
                  centred time floats to the middle of a long description
                  instead of sitting against the title it belongs to. */}
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 lg:self-start lg:pt-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {TIME.format(new Date(s.startsAt))}
                {s.endsAt ? ` – ${TIME.format(new Date(s.endsAt))}` : ""}
              </p>

              {/* `min-w-0`: a grid item's min-width defaults to `auto`, which
                  refuses to shrink below its content's min-content width — so
                  one long unbroken run in a title or an abstract pushed the
                  whole row wider than its track and the page scrolled
                  sideways on a phone. The same note `column-board` carries
                  about `min-height`. */}
              <div className="min-w-0">
                {/* The title is a link, and that is what pays for the clamp
                    below it. Every CMS session has a page now — /schedule/talk
                    used to be standalone-only, on the reasoning that an
                    activation page was already a session's home, which held
                    right up until that page stopped printing the whole
                    abstract. See `listTalks`. */}
                <h3 className="text-pretty text-lg font-medium">
                  <Link
                    href={`/schedule/talk/${s.slug}`}
                    className="group/talk rounded-sm text-white transition-colors duration-200 hover:text-magenta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magenta"
                  >
                    {s.title}
                    {/* Inline rather than a flex sibling, so on a title that
                        wraps it follows the last word instead of pinning to
                        the top-right of a two-line block. */}
                    <ArrowUpRight
                      className="ml-1.5 inline h-4 w-4 -translate-y-px opacity-45 transition-opacity duration-200 group-hover/talk:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </h3>

                {s.description && (
                  <>
                    <p
                      className={cn(
                        "mt-2 max-w-2xl text-pretty text-white/60",
                        s.description.length > DESC_CLAMP && "line-clamp-4",
                      )}
                    >
                      {s.description}
                    </p>
                    {/* Only under a clamped one. A reader whose paragraph
                        ended on a full stop needs no invitation to go and
                        read it again. */}
                    {s.description.length > DESC_CLAMP && (
                      <Link
                        href={`/schedule/talk/${s.slug}`}
                        className="group/more mt-2 inline-flex items-center gap-1.5 rounded-sm font-mono text-[11px] uppercase tracking-widest text-white/45 transition-colors duration-200 hover:text-magenta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magenta"
                      >
                        Read the full talk
                        <ArrowUpRight
                          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover/more:-translate-y-0.5 group-hover/more:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Link>
                    )}
                  </>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  {s.track && (
                    <span className="inline-block rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-magenta">
                      {s.track}
                    </span>
                  )}
                </div>

                <People participants={s.participants} byId={byId} />
              </div>
            </li>
          ))}
    </ol>
  );

  if (aside) {
    return (
      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          {/* `items-start` is what makes the pin work: a grid item stretches to
              the row by default, so its box is already the full height and
              `top` has nothing to pin against — the same note `ActivationDetail`
              carries over its own sticky column.

              The list takes the wider half. It holds abstracts and faces; the
              aside holds three paragraphs and stops. */}
          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[22rem_1fr] lg:items-start xl:grid-cols-[26rem_1fr]">
            {/* The list is first in the source, and the aside takes the left
                column back at `lg`.

                One column deep, "pinned beside the running order" is just
                "before the running order" — and on a phone that put 800px of
                why-Python-matters between a hero and the thing the page is
                for. The first session started 2,194px down an iPhone, which
                is 2.6 screens of scrolling to reach a schedule.

                Ordering rather than two copies of the block, and the source
                order is the phone's rather than the desktop's: a screen
                reader gets the running order first either way, which is the
                right answer for a page somebody opened to find out what is
                on. The context still reads as context — it just stops
                gatekeeping the list on the one screen size that cannot put
                them side by side. */}
            <div className="min-w-0">{list}</div>
            <div className="min-w-0 lg:sticky lg:top-24 lg:order-first">
              {aside}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            The running order
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
            What&rsquo;s on, in order.
          </h2>
        </div>
        {list}
      </div>
    </section>
  );
}

/**
 * One talk, in the hero's right-hand column.
 *
 * The reason this exists is a click count. A reader on /schedule sees the AWS
 * or GDG mark, clicks it, lands on a hero — and the talk they came for is a
 * scroll away, below a section rule, under a heading. On these pages the hero's
 * right half is empty: they carry no `hero` photograph, so a third of the frame
 * is black. Putting the talk there costs nothing and removes the scroll.
 *
 * One or two, never more. Five is a running order, which is what the section
 * below is for — but two half-hour talks inside a single community hour are
 * not a running order, they are the hour, and sending a reader past the fold
 * to find the second one is the scroll this component exists to remove.
 *
 * What changes at two is what the card can carry. One talk gets its abstract
 * whole, and the section below is suppressed because the hero has said
 * everything it would. Two get a bill — time, title, who — and the section
 * below still renders, because the abstracts have to live somewhere and a
 * hero is not where anyone finishes reading two of them. That is not the
 * collision the "one programme or the other" rule guards against: a bill and
 * a detailed order are different statements, the way the week board and this
 * page are.
 *
 * Below `lg` the hero is a single column and this simply stacks under the
 * copy, which is where the section put it anyway — minus the rule and the
 * heading. The scroll it saves is the desktop one; on a phone it saves a
 * section boundary.
 */
export function HeroTalk({
  sessions,
  speakers = [],
  showTime = true,
}: {
  /** One or two. See the note above for what changes between them. */
  sessions: SessionRow[];
  speakers?: CardSpeaker[];
  /**
   * Whether the talk's own hours are worth printing.
   *
   * False when they are the activation's hours, which the hero states three
   * inches to the left — one talk filling its activation's hour is the common
   * case here, and "2:00 PM – 3:00 PM" twice in one frame reads as two facts
   * when it is one. True when they differ, which is a thirty-minute keynote
   * inside an afternoon and genuinely new information.
   */
  showTime?: boolean;
}) {
  const byId = new Map(speakers.map((s) => [s.id, s]));
  const [session] = sessions;

  if (sessions.length > 1) {
    return (
      // The same surface, carrying a bill. Times always, unlike the solo
      // card: two talks inside one activation hour is exactly the case where
      // the hour on the left does not tell you when either of them starts.
      <div className="flex flex-col bg-white/5 p-6 lg:max-w-md lg:p-7">
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          The talks
        </p>
        <ol className="mt-1 flex flex-col">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="border-t border-white/10 pb-5 pt-5 last:pb-0"
            >
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {TIME.format(new Date(s.startsAt))}
                {s.endsAt ? ` – ${TIME.format(new Date(s.endsAt))}` : ""}
              </p>
              {/* No abstract. Two of them is the whole card and then some,
                  and this is the one case where the section below still
                  runs — so the ellipsis has somewhere to lead. */}
              <h2 className="mt-2 text-pretty text-lg font-medium leading-snug text-white">
                {s.title}
              </h2>
              {/* Names, not faces. The solo card gives a speaker a portrait,
                  a role and a link, because it has one talk's worth of room
                  and that is the payoff for a speaker CMS. Two portraits cost
                  ~120px here, which is the difference between this hero
                  fitting a laptop and not — and the faces are on the running
                  order directly below, where the abstracts are. */}
              {s.participants.length > 0 && (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-magenta">
                  {s.participants.map((who) => who.name).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    // A card, not a second masthead.
    //
    // Laid straight onto the hero behind a rule, this was two mastheads on one
    // plane: eyebrow, heading, body on the left; eyebrow, heading, body on the
    // right, at the same rank, in different faces. The eye could not tell
    // which one was the page. Two things fixed it, and the first is the one
    // that mattered.
    //
    // A surface. `bg-white/5` with the same padding SessionBento uses, because
    // this site already has a grammar for "a discrete object on a dark ground"
    // and inventing a second one here is what made these two halves argue. On
    // a surface the talk reads as something placed in the hero rather than as
    // a rival to it, and its label stops competing with the activation's own.
    //
    // And the type inside it comes back down. The title had been escalated to
    // Oswald caps, which is the page's own display voice — set beside GDG's
    // rounded lowercase logotype it was a second display face in one frame.
    // The running-order list has always set a talk in Geist medium, sentence
    // case; that is what a session title is here, and the hero is not a reason
    // to change it.
    <div className="flex flex-col bg-white/5 p-6 lg:max-w-md lg:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          The talk
        </p>
        {showTime && (
          <p className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/55">
            {TIME.format(new Date(session.startsAt))}
            {session.endsAt
              ? ` – ${TIME.format(new Date(session.endsAt))}`
              : ""}
          </p>
        )}
      </div>

      <h2 className="mt-4 text-pretty text-xl font-medium leading-snug text-white">
        {session.title}
      </h2>

      {session.description && (
        // Whole, not clamped. The first cut ran `line-clamp-5` on the
        // reasoning that a hero is not where you finish reading an abstract —
        // but this replaces the section that used to carry it, and the speaker
        // page prints a talk's title without its description. Clamped here,
        // the rest of the abstract existed nowhere on the site. An ellipsis
        // needs somewhere to lead.
        <p className="mt-3 text-pretty text-sm leading-relaxed text-white/60">
          {session.description}
        </p>
      )}

      {/* Footed under a hairline, the way every card on this site ends. */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <People participants={session.participants} byId={byId} noTopMargin />
      </div>
    </div>
  );
}

/**
 * The people giving a session.
 *
 * Shared by both layouts above, which is the whole reason it is a component:
 * the solo branch and the list branch differ in how a talk is framed, not in
 * how a speaker is drawn, and two copies would drift the moment one gained a
 * field.
 *
 * This replaced a line of mono caps — names and nothing else — on the one
 * surface where a reader has just decided a talk sounds interesting and wants
 * to know who is delivering it. A face, a role and a way to look someone up is
 * the payoff for having a speaker CMS at all.
 *
 * Names only while the lineup is under wraps: the speaker pages these link to
 * are behind the same switch, and a link to a hidden page is worse than plain
 * text. The portrait goes with them — an unannounced face is the announcement.
 */
function People({
  participants,
  byId,
  noTopMargin = false,
}: {
  participants: SessionRow["participants"];
  byId: Map<string, CardSpeaker>;
  /** The hero card foots them under its own rule and spaces them itself. */
  noTopMargin?: boolean;
}) {
  if (participants.length === 0) return null;

  return (
    <ul
      className={cn("flex flex-wrap gap-x-8 gap-y-4", !noTopMargin && "mt-5")}
    >
      {participants.map((p) => {
        const who = byId.get(p.speakerId);
        return (
          <li
            key={p.speakerId}
            // `min-w-0` here as well as on the name block inside it. The
            // inner one lets the role line shrink *within* this row; without
            // this one the row itself cannot shrink inside the wrapping list,
            // so its min-content — avatar, name, a role like "Sr Solutions
            // Architect · Temporal Technologies", and the LinkedIn mark —
            // became the page's width and a phone scrolled sideways. The
            // `truncate` on the role never engaged because nothing ever
            // constrained it.
            className="group/who relative flex min-w-0 items-center gap-3"
          >
            {SPEAKERS_ANNOUNCED && (
              <span className="relative size-11 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                {who?.imageUrl ? (
                  <Image
                    src={who.imageUrl}
                    // Decorative: the name is right beside it.
                    alt=""
                    fill
                    sizes="44px"
                    // The same grayscale the wall and the cards use, so a
                    // portrait pulled in here belongs to the same set as the
                    // ones on /speakers rather than reading as a stray photo.
                    className="object-cover object-top grayscale"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center bg-white/5 font-display text-base font-bold uppercase text-white/30"
                  >
                    {p.name.charAt(0)}
                  </span>
                )}
              </span>
            )}

            <span className="min-w-0">
              <span className="block text-pretty text-sm font-medium text-white">
                {/* Linked by slug. This used to interpolate `speakerId`, which
                    is the Firestore document id — /speakers/[slug] is keyed by
                    slug, so every name on every activation page pointed at a
                    404. Nothing surfaced it because the only activation with a
                    CMS session is this one, and it got its session after the
                    link was written. */}
                {SPEAKERS_ANNOUNCED && who ? (
                  <Link
                    href={`/speakers/${who.slug}`}
                    className="rounded-sm transition-colors duration-200 after:absolute after:inset-0 hover:text-magenta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
                  >
                    {p.name}
                  </Link>
                ) : (
                  p.name
                )}
              </span>
              {(who?.title || who?.company || p.role === "moderator") && (
                <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-widest text-white/50">
                  {p.role === "moderator"
                    ? "Moderator"
                    : [who?.title, who?.company].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>

            {/* Above the name's stretched link so it stays its own
                destination, the same split SpeakerCard makes. */}
            {SPEAKERS_ANNOUNCED && who?.linkedin && (
              <a
                href={who.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={profileLabel(p.name, who.linkedin)}
                className="relative z-10 -m-1.5 p-1.5 text-white/45 transition-colors duration-200 hover:text-magenta focus-visible:text-magenta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
              >
                <ProfileMark href={who.linkedin} className="h-4 w-4" />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
