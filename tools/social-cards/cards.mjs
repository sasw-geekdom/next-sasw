/**
 * Every speaker card, as data.
 *
 * One entry per card, one template per event. The templates live beside this
 * file and are never edited per speaker — that split is the whole point of the
 * directory. These cards were originally loose HTML files in a temp directory,
 * one per speaker, and it cost twice: a card was re-exported from a stale copy
 * that still had a device we had removed, and the sources were wiped mid-run
 * and had to be reconstructed from memory.
 *
 * ─── The two numbers that must be solved per portrait ───────────────────────
 *
 * `portrait.height` and `portrait.top` are not style choices and they do not
 * carry over between speakers.
 *
 *   height — matches the drawn head size to the others in the set. A
 *            head-and-shoulders crop and a full-body cutout need very
 *            different values to land the same size head.
 *   top    — aligns the crown. Two crops start at different depths (one
 *            subject 76px into a 1350px frame, another 130px), so equal
 *            offsets sit one lower and read as them being different heights.
 *
 * `npm run cards:probe -- <slug>` prints both suggestions for a headshot. Take
 * the offset from it; check the height by eye. The probe finds the chin by
 * watching for the shoulder line, and long hair hides it — on two subjects
 * here it undersized the head by about 15%.
 *
 * ─── Headshots ─────────────────────────────────────────────────────────────
 *
 * Resolved from the CMS by speaker slug at render time, never pinned as a URL.
 * A replaced photo changes its blob URL, and both times that happened the card
 * silently kept rendering the old one.
 */

/** Shared by every card. */
const WEEK = "Sept 28 – Oct 2";

export const EVENTS = {
  pysanantonio: {
    template: "pysanantonio.html",
    facts: ["Friday, October 2", "Geekdom, 3rd Floor"],
    // Hotlinked in lib/pysa.ts so a refreshed mark propagates without a
    // deploy; fetched and cached here for the same reason.
    logos: [
      {
        url: "https://devsa-assets.s3.us-east-2.amazonaws.com/pysa/flyers-46-alamo-py-white.png",
        height: 62,
      },
      {
        url: "https://devsa-assets.s3.us-east-2.amazonaws.com/pytexas.png",
        height: 62,
      },
      {
        url: "https://devsa-assets.s3.us-east-2.amazonaws.com/devsa-logo.svg",
        height: 50,
      },
    ],
  },

  "the-model-keynote": {
    template: "the-model.html",
    // The keynote is the one card in the set that carries a time — it is a
    // fixed slot inside the afternoon rather than the afternoon itself.
    facts: ["Monday, September 28  ·  1:30 PM", "Geekdom, 3rd Floor"],
    logos: [
      { partner: "The Creative Futures", height: 62 },
      { partner: "Tech Bloc", height: 50 },
      { repo: "public/access-granted/orgs/devsa.png", height: 46 },
    ],
  },

  "the-model": {
    template: "the-model-pair.html",
    facts: ["Monday, September 28", "Geekdom, 3rd Floor"],
    // The first two come off the CMS partner wall, by name. The third is in
    // the repo. Heights are balanced by drawn area rather than by height: a
    // solid block and a wordmark on open ground read very differently at the
    // same height.
    logos: [
      { partner: "The Creative Futures", height: 62 },
      { partner: "Tech Bloc", height: 50 },
      { repo: "public/access-granted/orgs/devsa.png", height: 46 },
    ],
  },

  "access-granted": {
    template: "access-granted.html",
    facts: ["Wednesday, September 30", "Geekdom, 3rd Floor"],
    // Six organisers, not three — which is why this event's strip is two rows
    // of three. One row can only hold them at 34px before it reaches the
    // figure, and Locksport is sized by eye above the rest: it is a narrow
    // silhouette over a small caption where the others are dense badges, so
    // an equal height reads visibly lighter.
    logos: [
      { repo: "public/access-granted/orgs/bsides.png", height: 64 },
      { repo: "public/access-granted/orgs/defcon.png", height: 64 },
      { repo: "public/access-granted/orgs/saha.png", height: 64 },
      { repo: "public/access-granted/orgs/cyberjedis.png", height: 64 },
      { repo: "public/access-granted/orgs/locksport.png", height: 84 },
      { repo: "public/access-granted/orgs/devsa.png", height: 64 },
    ],
  },
};

export const CARDS = [
  // ─── PySanAntonio ─────────────────────────────────────────────────────────
  {
    id: "pysanantonio-speaker-edwin-jung",
    event: "pysanantonio",
    speaker: "edwin-jung",
    headline: "Experiments in<br />Agentic Coding",
    // A full-body cutout, unlike every other headshot here — its head is 17%
    // of the frame where the rest run 37–46%.
    portrait: { height: 946, left: 411 },
  },
  {
    id: "pysanantonio-speaker-yossi-eliaz",
    event: "pysanantonio",
    speaker: "yossi-eliaz",
    // `requirements.txt` is a filename, not a phrase. Uppercased by the
    // headline's transform it stops reading as a file and the joke goes with
    // it, so it is set in mono, lowercase, in PySA's gold.
    headline: "Your Agent’s<code>requirements.txt</code>Is a Lie",
    portrait: { height: 903, left: 439 },
  },
  {
    id: "pysanantonio-speaker-shayan-ali",
    event: "pysanantonio",
    speaker: "shayan-ali",
    // 106px, not the default 88. A short hook only fills 748 of the 936px
    // measure at the default and leaves the top of the card light; broken to
    // two lines it orphans "WHEEL".
    headline: "AI Steering Wheel",
    headlineSize: 106,
    subtitle: "Giving Humans Control of the Black Box",
    portrait: { height: 903, left: 439 },
  },
  {
    id: "pysanantonio-speaker-samad-ahmed",
    event: "pysanantonio",
    speaker: "samad-ahmed",
    // Split at the colon. Whole, the line "AIR QUALITY PLATFORM" overflows the
    // measure and wraps on its own, which needed a step down to 76px and drew
    // visibly weaker than the rest of the set.
    headline: "From Sensor<br />to Signal",
    subtitle: "Building an Indoor Air Quality Platform With Python",
    portrait: { height: 903, left: 439 },
  },
  {
    id: "pysanantonio-speaker-jordana-naftali",
    event: "pysanantonio",
    speaker: "jordana-naftali",
    headline: "JOMO in the Age<br />of AI Slop",
    // Sentence case, where the talk title is lowercase. Deliberate next to
    // "JOMO", but a standalone line starting lowercase reads as a typo at
    // feed scale.
    subtitle: "The joy of missing out",
    portrait: { height: 903, left: 439 },
  },
  {
    id: "pysanantonio-speaker-mason-egger",
    event: "pysanantonio",
    speaker: "mason-egger",
    // No title yet, so the headline says the news. When one lands it takes
    // this slot and "Opening Keynote" becomes a marker above it.
    headline: "Opening Keynote",
    headlineSize: 106,
    // His CMS record says Sr Solutions Architect at Temporal; for a
    // PySanAntonio keynote the PyTexas hat is the relevant one, and PyTexas is
    // in the strip below him. Overridden here rather than in the CMS, so his
    // speaker page and this card currently disagree — see the README.
    role: "President",
    org: "PyTexas Foundation",
    portrait: { height: 903, left: 439 },
  },

  // ─── The Model ────────────────────────────────────────────────────────────
  {
    id: "the-model-speakers-hernandez-gallegos",
    event: "the-model",
    // One card, not two: they are co-founders of the same company giving one
    // talk, and the pairing is the story. Either can post it.
    speakers: ["serena-hernandez", "daniel-gallegos"],
    headline:
      'What happens when<br /><span class="hit">creative storytelling</span><br />collides with<br />startup strategy?',
    portraits: [
      { height: 740, top: -28 },
      { height: 622, top: -46 },
    ],
  },

  {
    id: "the-model-keynote-justin-johnson",
    event: "the-model-keynote",
    speaker: "justin-johnson",
    eyebrow: "// Keynote · The Model",
    headline:
      'The next era of the<br /><span class="hit">creator economy</span>',
    headlineSize: 69,
    subtitle:
      "What’s changing, where the opportunities are,<br />and what to build next.",
    // His record carries no company; the card lists where he has worked, which
    // is the credential that matters for this talk.
    org: "Meta · MoonPay · Acorns · Paxos",
    portrait: { height: 880, left: 500 },
  },

  // ─── Access Granted ───────────────────────────────────────────────────────
  {
    id: "access-granted-speaker-dante-moreno",
    event: "access-granted",
    speaker: "dante-moreno",
    headline: "Meow-ware",
    headlineSize: 118,
    subtitle: "A Look at the Gayfemboy Malware",
    portrait: { height: 918, left: 442 },
  },
];

export { WEEK };
