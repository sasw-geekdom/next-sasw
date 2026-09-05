import "server-only";

import { cache } from "react";
import { listSpeakers, listSessions } from "@/lib/admin/cms-queries";
import { TRACK_NAMES, type TrackName } from "@/lib/tracks";
import { ACTIVATION_SLUGS } from "@/lib/schedule";
import { VENUE_SLUGS } from "@/lib/locations";
import type { LineupSession, LineupSpeaker } from "@/lib/admin/cms-types";

// The public lineup, assembled once per request.
//
// A speaker's circuits and session list are both derived from the schedule
// rather than stored on the speaker: sessions already carry a track and a
// participant list, so inverting them is free and can't drift out of sync
// with what's actually programmed.

/**
 * Whether the lineup is public yet.
 *
 * Flip to `true` on announcement — that one change brings back the homepage
 * band and the /speakers wall together. Everything stays in the CMS meanwhile;
 * this only decides whether the public surfaces render it, so speakers can
 * keep being added and reordered before the reveal.
 *
 * Note it does NOT gate /speakers/[slug]. Those pages build and sit in the
 * sitemap either way — which is a problem only while this is `false`, since
 * an unannounced name is then reachable by URL and indexable with nothing
 * linking to it. Turning this on is what makes the sitemap honest; turning it
 * back off reopens that hole, so gate the route and drop the sitemap entries
 * if the lineup ever needs to go private again.
 */
export const SPEAKERS_ANNOUNCED = true;

async function safeList<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

function isTrack(value: string | null): value is TrackName {
  return value !== null && (TRACK_NAMES as readonly string[]).includes(value);
}

/**
 * Memoized per request — the detail route calls this from
 * `generateMetadata`, the page, and the OG image, and React's `cache` keeps
 * that to one Firestore round trip.
 */
export const loadLineup = cache(async (): Promise<LineupSpeaker[]> => {
  const [speakers, sessions] = await Promise.all([
    safeList(listSpeakers()),
    safeList(listSessions()),
  ]);

  const bySpeaker = new Map<
    string,
    {
      circuits: Set<TrackName>;
      activations: Set<string>;
      venues: Set<string>;
      sessions: LineupSession[];
    }
  >();

  for (const session of sessions) {
    for (const participant of session.participants) {
      let entry = bySpeaker.get(participant.speakerId);
      if (!entry) {
        entry = {
          circuits: new Set(),
          activations: new Set(),
          venues: new Set(),
          sessions: [],
        };
        bySpeaker.set(participant.speakerId, entry);
      }
      // Sessions arrive ordered by start time, so pushing preserves it.
      entry.sessions.push({
        id: session.id,
        slug: session.slug,
        title: session.title,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        location: session.location,
        track: session.track,
        activation: session.activation,
      });
      if (isTrack(session.track)) entry.circuits.add(session.track);
      if (session.activation) entry.activations.add(session.activation);
      if (session.location) entry.venues.add(session.location);
    }
  }

  return speakers.map((s) => {
    const entry = bySpeaker.get(s.id);
    return {
      ...s,
      // Canonical track order, so chips read consistently across the wall.
      circuits: entry ? TRACK_NAMES.filter((t) => entry.circuits.has(t)) : [],
      // Both ordered off the site's own lists rather than off insertion order,
      // so the wall's filter rows read in the same sequence as the schedule
      // and the footer, every render.
      activations: entry
        ? ACTIVATION_SLUGS.filter((a) => entry.activations.has(a))
        : [],
      venues: entry ? VENUE_SLUGS.filter((v) => entry.venues.has(v)) : [],
      sessions: entry?.sessions ?? [],
    };
  });
});

export type SlugMatch =
  | { speaker: LineupSpeaker; canonical: true }
  | { speaker: LineupSpeaker; canonical: false };

/**
 * Resolve a URL segment. A hit on `previousSlugs` comes back non-canonical so
 * the route can permanently redirect to the current URL instead of serving
 * the same person at two addresses.
 */
export function resolveSlug(
  lineup: LineupSpeaker[],
  slug: string,
): SlugMatch | null {
  const exact = lineup.find((s) => s.slug === slug);
  if (exact) return { speaker: exact, canonical: true };

  const renamed = lineup.find((s) => s.previousSlugs.includes(slug));
  if (renamed) return { speaker: renamed, canonical: false };

  return null;
}
