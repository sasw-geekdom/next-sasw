import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
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

const TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  hour: "numeric",
  minute: "2-digit",
});

export function ActivationSessions({
  sessions,
  speakers = [],
}: {
  sessions: SessionRow[];
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
                a label for a single thing sitting right beneath it. */}
            <h2 className="mt-4 text-pretty font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              {solo.title}
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

        <ol className="mt-10 flex flex-col lg:mt-12">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="grid gap-x-8 gap-y-3 border-t border-white/10 py-6 lg:grid-cols-[10rem_1fr]"
            >
              {/* self-start from lg: the grid cell stretches to the row, and a
                  centred time floats to the middle of a long description
                  instead of sitting against the title it belongs to. */}
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 lg:self-start lg:pt-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {TIME.format(new Date(s.startsAt))}
                {s.endsAt ? ` – ${TIME.format(new Date(s.endsAt))}` : ""}
              </p>

              <div>
                <h3 className="text-pretty text-lg font-medium text-white">
                  {s.title}
                </h3>

                {s.description && (
                  <p className="mt-2 max-w-2xl text-pretty text-white/60">
                    {s.description}
                  </p>
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
            className="group/who relative flex items-center gap-3"
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
