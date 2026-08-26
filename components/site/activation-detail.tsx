import type { FeaturedSession } from "@/lib/schedule";
import Image from "next/image";
import { OrganizerLogo } from "@/components/site/organizer-logo";
import type { CardSpeaker } from "@/components/site/speaker-card";
import { SpeakerPeek } from "@/components/site/speaker-peek";
import { SPEAKERS_ANNOUNCED } from "@/lib/speakers";
import { cn } from "@/lib/utils";

// An organiser's own account of their activation, from lib/schedule.
//
// The sibling of ActivationSessions, and mutually exclusive with it: this is
// copy an organiser sent over, that one is rows they entered in the CMS. The
// slug page renders whichever exists, never both, so a morning can't appear
// twice in two formats — which is the trap that took Access Granted's
// hardcoded programme columns off its page.
//
// Two columns from lg, and a rail down the running order.
//
// The first version was a single narrow column: eyebrow, prose, then five
// equal rows in a 10rem/1fr grid capped at max-w-2xl. That left ~450px of dead
// black to the right of every row on a laptop, gave mobile a flat stack with
// nothing to break it, and — with no Oswald headline anywhere in the section —
// pushed the display weight onto a 24px paragraph, the one place on this site
// where body type does a display font's job.
//
// So: the intro pins on the left and the programme scrolls past it, which
// spends the width the page already has; and the rail carries down to mobile,
// where it's the only thing standing between the reader and a wall of text.
//
// The programme here deliberately carries pre-formatted time strings rather
// than real timestamps. "7:30" is a door time and "8:45 – 9:30" is a slot;
// giving each a `when` would put five entries into the week's data that no
// other part of the site should ever treat as sessions.

type Detail = NonNullable<FeaturedSession["detail"]>;
type Item = NonNullable<Detail["programme"]>[number];

export function ActivationDetail({
  detail,
  speakers = [],
}: {
  detail: FeaturedSession["detail"];
  /**
   * The roster, so a name in the programme can show the face behind it.
   *
   * Keyed by slug rather than by name, for the same reason the link is: the
   * brunch bills one of its two as "Nic McGinnis" and his page is "Nicholas
   * McGinnis".
   */
  speakers?: CardSpeaker[];
}) {
  if (!detail) return null;

  const bySlug = new Map(speakers.map((s) => [s.slug, s]));

  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-24">
          {/* `self-start` as well as `sticky`: a grid item stretches to the row
              by default, so its box is already the full height and there is
              nothing for `top` to pin against. `top-24` clears the 4rem header
              with air to spare. */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              {detail.eyebrow ?? "The morning"}
            </p>
            {/* One block per sentence, so a headline built of several starts
                each on its own line instead of breaking wherever the column
                runs out. "Come for the coffee. Stay for the conversations.
                Leave with something to build." wrapped with "Leave" stranded
                at the end of the third line, which buries the beat the line is
                built on. A headline with no sentence break renders as one
                block and is unaffected. */}
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              {sentences(detail.headline).map((line, i) => (
                <span key={i} className="block text-pretty">
                  {line}
                </span>
              ))}
            </h2>
            {detail.lede.map((para, i) => (
              <p
                key={i}
                className={
                  // Standfirst, not display type. The opening paragraph still
                  // leads — white, a step up in size — but the headline above
                  // now carries the weight, so this doesn't have to.
                  i === 0
                    ? "mt-5 text-pretty text-lg leading-relaxed text-white/90"
                    : "mt-4 text-pretty text-white/60"
                }
              >
                {para}
              </p>
            ))}

            {/* How to get in, at the foot of the intro rather than at the foot
                of the section.
    
                Two reasons. It answers "do I need to do anything?" while the
                reader is still deciding, instead of after they've read a
                running order they may have assumed was ticketed. And it gives
                this column something to end on — pinned, a short column leaves
                the eye on empty space once the programme scrolls past it.
    
                Measured before moving: the column runs 384x393 and this adds
                ~150px, which still clears the pin on a 1280x800 laptop with
                150px to spare. */}
            {/* The orgs behind it, in the pinned column under the lede — the
              same label-over-a-row the bands use, so an activation without a
              band credits its partners the same way one with a band does. */}
            {detail.poweredBy && detail.poweredBy.length > 0 && (
              <div className="mt-9">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
                  Powered by
                </p>
                <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-6 sm:gap-x-10">
                  {detail.poweredBy.map((o) => (
                    <li key={o.name}>
                      <OrganizerLogo org={o} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.access && (
              <p className="mt-8 border-t border-white/10 pt-6 text-pretty text-sm text-white/55">
                {detail.access}
              </p>
            )}
          </div>

          {/* A room's guests, where there is no running order to list. See
              `detail.spotlight` — the two are alternatives, and a social gets
              this one. */}
          {detail.spotlight && detail.spotlight.length > 0 && (
            <ul className="space-y-8">
              {detail.spotlight.map((mark) => {
                const body = (
                  <>
                    <Image
                      src={mark.src}
                      alt={mark.alt}
                      width={mark.width}
                      height={mark.height}
                      className="size-16 shrink-0 rounded-full object-contain sm:size-20"
                    />
                    <span className="min-w-0">
                      <span className="block text-pretty font-display text-xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-2xl">
                        {mark.name}
                      </span>
                      <span className="mt-2 block text-pretty text-white/60">
                        {mark.note}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={mark.name}>
                    {mark.href ? (
                      <a
                        href={mark.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-start gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="flex items-start gap-5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {detail.programme && detail.programme.length > 0 && (
            <ol className="relative">
              {detail.programme.map((item, i) => (
                <Row
                  key={item.time + item.title}
                  item={item}
                  last={i === detail.programme!.length - 1}
                  bySlug={bySlug}
                />
              ))}
            </ol>
          )}
        </div>

        {(detail.coda || detail.kicker) && (
          /* Rule full width, copy at the text measure. Hung on a max-w-2xl box
             it stopped halfway across while every programme row's rule ran to
             the edge, which read as a broken row rather than a seam. */
          <div className="mt-16 border-t border-white/10 pt-10 lg:mt-20">
            {detail.coda && (
              <p className="max-w-3xl text-pretty text-lg leading-relaxed text-white/70">
                {detail.coda}
              </p>
            )}
            {detail.kicker && (
              <p
                className={cn(
                  "max-w-3xl text-pretty font-display text-2xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-3xl",
                  detail.coda && "mt-8",
                )}
              >
                {detail.kicker}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Split on sentence ends, keeping the full stop. Returns the whole string as a
 * single entry when there's nothing to split on, so this can't drop copy.
 */
function sentences(text: string): string[] {
  const parts = text.split(/(?<=\.)\s+/).filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

function Row({
  item,
  last,
  bySlug,
}: {
  item: Item;
  last: boolean;
  bySlug: Map<string, CardSpeaker>;
}) {
  const feature = item.feature === true;

  return (
    <li className={cn("relative pl-8 sm:pl-10", last ? "pb-0" : "pb-10")}>
      {/* The rail, drawn per row rather than once behind the list: a single
          absolute line down the <ol> would need to know where the last node
          sits to stop there, and would run past it into the closing block. */}
      {!last && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-[5px] top-3 -bottom-1 w-px",
            feature ? "bg-magenta/40" : "bg-white/12",
          )}
        />
      )}

      {/* Filled for the two conversations, hollow for the texture around them.
          The node is the only thing carrying that distinction at a glance
          before you have read a word. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-2 h-[11px] w-[11px] rounded-full border-2",
          feature ? "border-magenta bg-magenta" : "border-white/30 bg-black",
        )}
      />

      <p
        className={cn(
          "font-mono text-[11px] uppercase tracking-widest",
          feature ? "text-magenta" : "text-white/55",
        )}
      >
        {item.time}
      </p>

      {/* The show name above the session title, not concatenated into it.
          "The Fifth Degree Live · The Collision: AI, Design, and What Gets
          Built Next" is too long to scan as one heading, and the two facts
          aren't equal — the title is what this hour is about, the series is
          who's running it. Kept out of the h3 so the heading text stays the
          session, which is what an outline and a share card should carry. */}
      {item.series && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/45">
          {item.series}
        </p>
      )}

      <h3
        className={cn(
          "text-pretty font-display font-bold uppercase leading-[1.05] tracking-tight text-white",
          item.series ? "mt-1.5" : "mt-2",
          feature ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
        )}
      >
        {item.title}
      </h3>

      {/* Names before prose. These are the reason someone blocks out a
          Thursday morning, and in the first version they were three sentences
          deep in a paragraph. */}
      {item.people && item.people.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {item.people.map((person) => (
            <li key={person.name} className="min-w-0">
              {/* Linked where the person has a page, and only once the lineup
                  is public — the speaker pages are behind that switch, and a
                  link to a hidden one is worse than plain text. Everyone else
                  in a programme stays exactly as they were: a caterer and a DJ
                  are billed here and have no page to send anyone to. */}
              {/* The face lives with the name, on hover and on focus. See
                  SpeakerPeek — it owns the trigger because the spring and the
                  cursor tilt both need state a stylesheet cannot hold.
              
                  Hidden by default, which is only defensible because it is not
                  the information: the name and the role are on the page
                  already, and this is recognition on top of them. A portrait a
                  reader *needs* has no business behind an interaction — which
                  is why the CMS-driven sessions on other pages show theirs
                  inline and this does not copy them. The rest is a running
                  order; a portrait beside every name turns a schedule into a
                  cast list, and the compact name-and-role pair is what lets the
                  morning read as a sequence. */}
              <p className="text-pretty font-medium text-white">
                {SPEAKERS_ANNOUNCED && person.speaker ? (
                  <SpeakerPeek
                    name={person.name}
                    slug={person.speaker}
                    imageUrl={bySlug.get(person.speaker)?.imageUrl}
                  />
                ) : (
                  person.name
                )}
              </p>
              <p className="text-pretty font-mono text-[10px] uppercase tracking-widest text-white/45">
                {person.role}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 max-w-2xl text-pretty text-white/60">{item.body}</p>
    </li>
  );
}
