import Link from "next/link";
import { Clock } from "lucide-react";
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

export function ActivationSessions({ sessions }: { sessions: SessionRow[] }) {
  if (sessions.length === 0) return null;

  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
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
                  {/* Names only while the lineup is under wraps — the speaker
                      pages they would link to are behind the same switch, and
                      a link to a hidden page is worse than plain text. */}
                  {s.participants.length > 0 && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/55">
                      {s.participants.map((p, i) => (
                        <span key={p.speakerId}>
                          {i > 0 && " · "}
                          {SPEAKERS_ANNOUNCED ? (
                            <Link
                              href={`/speakers/${p.speakerId}`}
                              className="transition-colors duration-200 hover:text-magenta"
                            >
                              {p.name}
                            </Link>
                          ) : (
                            p.name
                          )}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
