import Image from "next/image";
import Link from "next/link";
import { ProfileMark, profileLabel } from "@/components/site/profile-mark";
import { cn } from "@/lib/utils";
import type { SpeakerRow } from "@/lib/admin/cms-types";
import type { TrackName } from "@/lib/tracks";

// The lineup card, shared by the homepage band and the /speakers wall.
//
// Headshots arrive from the CMS at whatever crop and quality the speaker sent,
// so the treatment does the normalizing: every portrait is forced to one 4:5
// with a top-biased crop (faces sit high in a headshot), and every portrait
// stays desaturated — including on hover. Grayscale is what makes a wall of
// mismatched source photos read as one set, so releasing it on hover undid
// the only thing holding them together.
//
// The card is deliberately still. Hover moves nothing but the LinkedIn mark;
// the portraits don't scale, recolour, glow, or warm their ring. On a grid of
// faces that reads as a lineup rather than a set of controls.
//
// Two destinations, one card: the whole surface leads to the speaker's page
// via a stretched pseudo-element behind everything, and the LinkedIn mark
// sits above it as a genuinely separate link. That's why the card isn't a
// wrapping <a> — an anchor inside an anchor is invalid, and the name is the
// better accessible label for the card anyway.

export type CardSpeaker = Pick<
  SpeakerRow,
  "id" | "slug" | "name" | "title" | "company" | "imageUrl" | "linkedin"
>;

interface SpeakerCardProps {
  speaker: CardSpeaker;
  /** Circuits this speaker carries, resolved from their sessions. */
  circuits?: TrackName[];
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function SpeakerCard({
  speaker,
  circuits = [],
  sizes,
  priority,
  className,
}: SpeakerCardProps) {
  const caption = [speaker.title, speaker.company].filter(Boolean).join(" · ");

  return (
    <article className={cn("group relative", className)}>
      <div className="relative">
        {/* The ring warms on keyboard focus only. On a pointer the card gives
            nothing back but the LinkedIn mark fading in and the cursor — no
            glow, no scale, no colour. Focus is the exception: the two
            focusable things here outline themselves, but those outlines land
            on a line of text and a 20px icon, so widening the cue to the whole
            portrait is a real gain for keyboard users, and it costs mouse
            users nothing since `focus-within` never fires for them.

            No ground colour either: `object-cover` hides it behind an opaque
            photo, and it would only ever surface under a transparent PNG,
            where a blue tint is the last thing a cutout wants. */}
        <div className="relative aspect-4/5 overflow-hidden rounded-lg ring-1 ring-white/10 transition-shadow duration-500 ease-in-out motion-reduce:transition-none group-focus-within:ring-magenta/60">
          {speaker.imageUrl ? (
            <Image
              src={speaker.imageUrl}
              // Decorative — the name renders as text directly below.
              alt=""
              fill
              sizes={sizes}
              priority={priority}
              // No scale and no desaturation change, so nothing about the
              // image itself moves on hover. A crop that grows inside a fixed
              // frame re-crops the face mid-transition, and dropping grayscale
              // broke the wall's one unifying treatment — the ring and glow
              // around it do the reacting.
              className="object-cover object-top grayscale"
            />
          ) : (
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center font-display text-4xl font-bold uppercase text-white/25"
            >
              {speaker.name.charAt(0)}
            </span>
          )}
          {/* Foot the portrait in black so the name reads as attached to it. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-black/70 to-transparent"
          />
        </div>

        {/* Above the stretched card link (z-10) so it stays clickable. Hidden
            until hover on pointer devices; always shown where there's no
            hover to reveal it, and on keyboard focus.

            No plate behind it — the mark sits straight on the portrait's
            gradient foot, which is already dark enough to carry white. The
            padding is invisible but gives the 20px glyph a ~32px hit area,
            which is what makes it usable on touch. */}
        {speaker.linkedin && (
          <a
            href={speaker.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label={profileLabel(speaker.name, speaker.linkedin)}
            className="absolute bottom-1 right-1 z-20 p-1.5 text-white opacity-0 transition-[opacity,color] duration-300 ease-in-out motion-reduce:transition-none hover:text-magenta focus-visible:opacity-100 focus-visible:text-magenta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <ProfileMark href={speaker.linkedin} className="h-5 w-5" />
          </a>
        )}
      </div>

      <h3 className="mt-3.5 font-display text-base font-bold uppercase leading-tight text-white sm:text-lg">
        <Link
          href={`/speakers/${speaker.slug}`}
          // Stretches to cover the card without wrapping it in an anchor.
          className="rounded-sm after:absolute after:inset-0 after:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
        >
          {speaker.name}
        </Link>
      </h3>

      {caption && (
        <p className="mt-1.5 line-clamp-2 font-mono text-[11px] uppercase leading-relaxed tracking-widest text-white/55">
          {caption}
        </p>
      )}

      {circuits.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="truncate rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-magenta">
            {circuits[0]}
          </span>
          {circuits.length > 1 && (
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-white/55">
              +{circuits.length - 1}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
