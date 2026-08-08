import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  // sharp is a native module (used by the gallery thumbnail pipeline) — keep it
  // external so the bundler doesn't try to bundle its platform binaries.
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // CMS image uploads go through server actions, and the default cap is
      // 1 MB — under a typical headshot, so saving a speaker blew up with
      // "Body exceeded 1 MB limit" before validation ever ran.
      //
      // 4mb, not more: Vercel caps a function's request body at 4.5 MB and no
      // config lifts that, so anything higher would just move the failure to a
      // 413. The remainder is headroom for the boundary and part headers
      // multipart adds around the file. Keep in step with MAX_IMAGE_BYTES in
      // lib/images.ts.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    // Vercel Blob (CMS/admin images) + Firebase Storage (video) remote sources.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
  async redirects() {
    // `permanent: true` is a 308, which Google treats as a 301 for ranking
    // but which also preserves the request method.
    //
    // CAUTION: this matcher is case-INSENSITIVE (`sensitive: false` in Next's
    // path-match). A source that differs from its destination only by case
    // matches its own destination and loops forever — `/Speakers` ->
    // `/speakers` took the live speakers page down in testing, 308ing to
    // itself. Case-only redirects live in proxy.ts, which compares exactly.
    // Every source below differs from its destination by more than case.
    return [
      // The Call for Speakers page became the Plug In hub.
      {
        source: "/call-for-speakers",
        destination: "/plug-in",
        permanent: true,
      },

      // ── Paths from the two previous sasw.co builds ───────────────────────
      // Found by enumerating the Wayback Machine's CDX index for the domain:
      // 245 archived HTML paths, of which the ones below still had crawlable
      // captures and a genuine equivalent here. Anything without a real
      // counterpart is deliberately left to 404 — see the note at the end.

      // Same page, new address.
      { source: "/Home", destination: "/", permanent: true },
      { source: "/homepage-2", destination: "/", permanent: true },
      { source: "/about", destination: "/", permanent: true },
      { source: "/GetInvolved", destination: "/get-involved", permanent: true },
      {
        source: "/get-involved-2-2",
        destination: "/get-involved",
        permanent: true,
      },

      // The schedule, and the tracks that became circuits. `:slug*` also
      // matches the bare path, so these cover /tracks and its ~20 children.
      { source: "/tracks/:slug*", destination: "/schedule", permanent: true },

      // Sponsorship now runs through Get Involved — the wall on the homepage
      // is display only. Covers /sponsors and its ~20 per-sponsor pages.
      // NOTE: redirects run before static files are served, so this rule
      // would swallow anything under `public/sessions/` too — it did, and
      // turned every activation logo and hero into a 404 pointing at
      // /schedule/<file>. That art lives in `public/activations/` now, clear
      // of both this rule and the /schedule/[slug] route.
      //
      // Ours, not the old site's. /sessions was this build's schedule until the
      // word turned out to mean two things: every piece of copy on that page
      // already called it "the schedule", while "session" is what a speaker
      // pitches on /plug-in. The child route has to come first — Next matches
      // in order, and the bare /sessions rule would otherwise swallow
      // /sessions/mission-pitch and drop people at the index.
      {
        source: "/sessions/:slug*",
        destination: "/schedule/:slug*",
        permanent: true,
      },
      { source: "/sessions", destination: "/schedule", permanent: true },
      {
        source: "/our-sponsors",
        destination: "/get-involved",
        permanent: true,
      },
      {
        source: "/sponsors/:slug*",
        destination: "/get-involved",
        permanent: true,
      },

      // A retrospective on the event's history, which is what /15-years is.
      {
        source: "/five-year-impact-report",
        destination: "/15-years",
        permanent: true,
      },

      // Attendee logistics. There's no housing or parking page here, so these
      // go to the nearest matching intent rather than the homepage: someone
      // looking for where to stay is an attendee, and /register is the page
      // that promises to email them the schedule.
      { source: "/attend", destination: "/register", permanent: true },
      {
        source: "/HousingLogistics",
        destination: "/register",
        permanent: true,
      },
      { source: "/housing", destination: "/register", permanent: true },
      { source: "/TransitParking", destination: "/register", permanent: true },
      { source: "/transit-parking", destination: "/register", permanent: true },

      // The old news section. No blog on this build, and the homepage is the
      // closest thing to "what's happening".
      { source: "/Blog", destination: "/", permanent: true },
      { source: "/BlogPost", destination: "/", permanent: true },

      // NOT redirected, on purpose: ~40 individual blog posts and press
      // releases, /core-team and its ~30 bios, /category/* and /author/*,
      // /gaming-summit, and the WordPress leftovers (/wp-*, /feed.xml). None
      // has a counterpart here, and pointing dozens of unrelated URLs at the
      // homepage is what Google treats as a soft 404 — a clean 404 is the
      // honest answer and the better signal.
    ];
  },
};

export default withBotId(nextConfig);
