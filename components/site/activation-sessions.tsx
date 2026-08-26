import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { LinkedInMark } from "@/components/site/linkedin-mark";
import type { CardSpeaker } from "@/components/site/speaker-card";
import type { SessionRow } from "@/lib/admin/cms-types";
import { SPEAKERS_ANNOUNCED } from "@/lib/speakers";

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

                {/* Who is giving it.
                
                    This was a line of mono caps — names and nothing else — on
                    the one surface where a reader has just decided a talk
                    sounds interesting and wants to know who is delivering it.
                    A face, a role and a way to look someone up is the payoff
                    for having a speaker CMS at all.
                
                    Names only while the lineup is under wraps: the speaker
                    pages these link to are behind the same switch, and a link
                    to a hidden page is worse than plain text. The portrait
                    goes with them — an unannounced face is the announcement.
                */}
                {s.participants.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                    {s.participants.map((p) => {
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
                                  // The same grayscale the wall and the cards
                                  // use, so a portrait pulled in here belongs
                                  // to the same set as the ones on /speakers
                                  // rather than reading as a stray photo.
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
                              {/* Linked by slug. This used to interpolate
                                  `speakerId`, which is the Firestore document
                                  id — /speakers/[slug] is keyed by slug, so
                                  every name on every activation page pointed
                                  at a 404. Nothing surfaced it because the
                                  only activation with a CMS session is this
                                  one, and it got its session after the link
                                  was written. */}
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
                            {(who?.title ||
                              who?.company ||
                              p.role === "moderator") && (
                              <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-widest text-white/50">
                                {p.role === "moderator"
                                  ? "Moderator"
                                  : [who?.title, who?.company]
                                      .filter(Boolean)
                                      .join(" · ")}
                              </span>
                            )}
                          </span>

                          {/* Above the name's stretched link so it stays its
                              own destination, the same split SpeakerCard
                              makes. */}
                          {SPEAKERS_ANNOUNCED && who?.linkedin && (
                            <a
                              href={who.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${p.name} on LinkedIn`}
                              className="relative z-10 -m-1.5 p-1.5 text-white/45 transition-colors duration-200 hover:text-magenta focus-visible:text-magenta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
                            >
                              <LinkedInMark className="h-4 w-4" />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
