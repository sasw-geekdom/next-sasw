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
 * A replaced photo has changed its blob URL twice, and both times the card
 * silently kept rendering the old one.
 *
 * It does not always change it. Mason Egger's replacement kept the same
 * address, which the render cache treated as proof nothing had moved — so the
 * card drew the old photograph until the cache was cleared by hand. That is
 * fixed in `fetchCached`, which now revalidates rather than trusting a hit,
 * but the rule to remember is that the URL is not the version.
 */

/** Shared by every card. */
const WEEK = "Sept 28 – Oct 2";

/**
 * The six community groups, all on one template.
 *
 * They differ only in their mark, their day and their hour — every one runs at
 * The Rand, none has a palette of its own, and none has a partner coalition
 * behind it. See the note at the top of community-group.html for why that
 * makes them one template where PySA, The Model and Access Granted are three.
 *
 * `mark.height` is per group because these lockups run from 3.3:1 to 10:1.
 */
/**
 * Day on one line, hour and room on the next — not "day · hour" and then the
 * room. These are the only cards carrying a time, and "Tuesday, September 29
 * · 2 – 3 PM" runs 463px, which reaches into the figure. Split this way the
 * longest line is the second one and it stops short of the jacket.
 */
const AT_THE_RAND = (mark, markHeight, day, hours) => ({
  template: "community-group.html",
  mark: { repo: `public/activations/${mark}`, height: markHeight },
  facts: [day, `${hours}  ·  The Rand, 3rd Floor`],
  logos: [],
});

/**
 * The one community-shaped card that is not at The Rand and has no speaker.
 *
 * Alamo Inventors' panel runs in UTSA's San Pedro II for the evening, and the
 * panelists are not named. `community-group.html` already covers both: its
 * name block is conditional on `first`, so with no speaker it draws the mark,
 * the headline and the facts and stops, and with no `face` it swaps the ground
 * bolt for the hero one. A template of its own would have been a copy of that
 * with the venue changed.
 *
 * The mark is the group's own badge rather than a wordmark, so it takes a
 * taller box than the lockups beside it — those run 3.3:1 to 10:1 and this is
 * nearly square.
 */
const CYBER_AI_ROBOTICS = {
  template: "panel.html",
  // `height` is the badge's *width* on this template — it is nearly square, so
  // sizing it by height the way a 10:1 wordmark is sized would have drawn it a
  // fifth of the space it wants.
  mark: { repo: "public/activations/alamo-inventors-carsig.png", height: 440 },
  facts: ["Wednesday, September 30", "6:30 \u2013 8 PM  ·  UTSA San Pedro II"],
  // "Venue by", not the "Powered by" the community cards print. UT San Antonio
  // is not running this panel — Alamo Inventors are, and the badge above says
  // so; UTSA gave the room, through the Harvey Najim Innovation Center.
  poweredLabel: "Venue by",
  logos: [{ repo: "public/activations/ut-san-antonio.svg", height: 34 }],
};

export const COMMUNITY = {
  "dotnet-user-group": AT_THE_RAND(
    "dotnet-user-group.svg",
    58,
    "Tuesday, September 29",
    "1 – 2 PM",
  ),
  "google-developer-groups": AT_THE_RAND(
    "google-developer-groups.svg",
    46,
    "Tuesday, September 29",
    "2 – 3 PM",
  ),
  aitx: AT_THE_RAND("aitx.svg", 62, "Tuesday, September 29", "3 – 4 PM"),
  datanauts: AT_THE_RAND(
    "datanauts.webp",
    62,
    "Thursday, October 1",
    "1 – 2 PM",
  ),
  "aws-user-group": AT_THE_RAND(
    "aws-user-group.svg",
    58,
    "Thursday, October 1",
    "2 – 3 PM",
  ),
  // The one community group with a strip. The others are a single host whose
  // mark is already at the top of the card, which is why the template has no
  // strip by default — but Linux San Antonio is three, and says so on its own
  // page: `poweredBy` on the activation in lib/schedule.ts names the same
  // learnOPENtech, Texas Linux Fest and DEVSA, in the same order.
  "linux-satx": {
    ...AT_THE_RAND("linux-satx.webp", 72, "Thursday, October 1", "3 – 5 PM"),
    // Scaled off the site's classes, which size these by drawn width rather
    // than height: learnOPENtech is a 10:1 wordmark, TXLF 4.5:1, DEVSA a
    // badge. Same three heights the Give-a-LOT card settled on.
    logos: [
      { repo: "public/give-a-lot/learnopentech.svg", height: 30 },
      { repo: "public/activations/txlf.webp", height: 50 },
      { repo: "public/access-granted/orgs/devsa.png", height: 60 },
    ],
  },
};

/**
 * Everything DEVSA brought to the week, in three groups, because they are
 * three different claims.
 *
 * `BUILT` is what did not exist before this week: The Model, Access Granted,
 * College Night, Linux San Antonio, Open Circuit and PySanAntonio were
 * programmed for it.
 *
 * `INVITED` is the opposite relationship. Give-a-LOT is a drive DEVSA and
 * learnOPENtech already run, and the AWS User Group, Datanauts, Google
 * Developer Groups, AITX and .NET already meet every month — DEVSA did not
 * activate any of them, it brought them into the week. Calling both
 * halves "activations" made a standing community group sound like a brand
 * campaign, and it argued against DEVSA's own line: "we don't replace the
 * communities doing the work — we host them, connect them, and help them
 * grow". One label over all twelve makes DEVSA the producer of all twelve.
 *
 * `PARTNERS` are the organisations named in those activations' own "powered
 * by" lines. None of them has a slot on the schedule.
 *
 * `repo` where the mark is vendored here; `url` where it is not — Alamo Python
 * and PyTexas live on DEVSA's own S3 and lib/pysa.ts reads them from there, so
 * this reads them from there too rather than committing a copy that can drift.
 * `partner` resolves from the CMS partner wall by name, which is the same
 * bargain lib/the-model.ts makes for Tech Bloc and The Creative Futures.
 * `html` for the three that own no logo at all: their mark is the display face
 * in their own accent, from lib/the-model.ts, lib/access-granted.ts and the
 * house magenta.
 */
const DEVSA_BUILT = [
  // Its penguin and two-line lockup fill their box corner to corner where the
  // wordmarks beside it do not, so at 1.0 it draws heavier than the row.
  { repo: "public/activations/linux-satx.webp", scale: 0.86 },
  { html: '<span class="typeset">The <span class="lav">Model</span></span>' },
  {
    // The terminal prompt, which is Access Granted's own label device — it
    // opens "&gt;_ access granted /" on the padlock, and its social card sets
    // every label with it where the other events use "//". Two characters,
    // and the cell goes from a green wordmark to something a reader clocks as
    // a security event without a logo to tell them.
    //
    // This is what a still card can do instead of the hover the block on the
    // schedule gets: `CipherField` decrypts a patch of ciphertext under the
    // pointer, and a PNG has no pointer. Its reduced-motion state — the field
    // written once, holding still — was the other candidate and does not
    // survive the shrink: a cell is 210x66, where a field of characters is a
    // smudge behind the one thing that has to stay legible, and it would give
    // one cell a background treatment no other mark here has.
    html: '<span class="typeset"><span class="prompt">&gt;_</span> <span class="green">Access</span> Granted</span>',
  },
  {
    html: '<span class="typeset">College <span class="mag">Night</span></span>',
  },
  { repo: "public/activations/open-circuit.webp" },
  { repo: "public/pysa/wordmark-dark.svg" },
];

const DEVSA_INVITED = [
  // Its own lockup, the one lib/give-a-lot.ts names.
  { repo: "public/give-a-lot/lockup.svg" },
  // The smile hangs below the letters, so a box centred on the file sits
  // "aws" above the wordmark beside it. Nudged onto its line.
  { repo: "public/activations/aws-user-group.svg", shift: 6 },
  { repo: "public/activations/datanauts.webp" },
  { repo: "public/activations/google-developer-groups.svg" },
  // Smaller than its box allows: at 3.7:1 it is width-constrained and draws
  // larger than the wordmarks either side of it.
  { repo: "public/activations/aitx.svg", scale: 0.78 },
  { repo: "public/activations/dotnet-user-group.svg" },
];

const DEVSA_PARTNERS = [
  // Access Granted's coalition leads, in the order that activation names
  // them, then PySanAntonio's organisers, then the rest.
  //
  // A 1:1 badge with wide transparent margin, so it draws small against the
  // wordmarks at a shared box.
  { repo: "public/access-granted/orgs/bsides.png", scale: 1.28 },
  { repo: "public/access-granted/orgs/defcon.png" },
  { repo: "public/access-granted/orgs/saha.png" },
  { repo: "public/access-granted/orgs/cyberjedis.png" },
  // The thinnest drawing in the set — line art inside a 265x260 canvas — so
  // it needs the most of its box back.
  { repo: "public/access-granted/orgs/locksport.png", scale: 1.5 },
  { repo: "public/give-a-lot/learnopentech.svg" },
  {
    url: "https://devsa-assets.s3.us-east-2.amazonaws.com/pysa/flyers-46-alamo-py-white.png",
  },
  { url: "https://devsa-assets.s3.us-east-2.amazonaws.com/pytexas.png" },
  // Same as Linux San Antonio's: heavy display type plus a badge, filling
  // its box where its neighbours' wordmarks leave air.
  { repo: "public/activations/txlf.webp", scale: 0.86 },
  { partner: "Tech Bloc" },
  // Vendored, not resolved from this repo's partner wall — and that is a
  // correction rather than a preference. The two sites read different
  // Firestore projects, so "The Creative Futures" resolved to a different
  // upload in each: this repo's record is the hairline ring on its own,
  // DEVSA's is the full lockup, badge and wordmark, solid white at 1405x442.
  // DEVSA convened this partner, so DEVSA's file is the correct one, and it
  // is committed here rather than read from their storage because that URL
  // carries an upload timestamp and dies on their next re-upload.
  //
  // No `scale`. The ring needed 1.25 because a hairline drawing reads light
  // at a box its neighbours fill with solid ink; a 3.2:1 wordmark fills its
  // box the way the other wordmarks in this band do.
  { repo: "public/activations/the-creative-futures.webp" },
];

const DEVSA_MARKS = [...DEVSA_BUILT, ...DEVSA_INVITED, ...DEVSA_PARTNERS];
const DEVSA_SPLITS = [
  DEVSA_BUILT.length,
  DEVSA_BUILT.length + DEVSA_INVITED.length,
];

export const EVENTS = {
  ...COMMUNITY,

  /**
   * DEVSA, which is a partner rather than an activation — the one entry here
   * that is not a thing on the schedule. It carries no mark of its own in the
   * template's sense (the card stages DEVSA's logo directly, the way it does
   * the house lockup) and no logo strip, because the strip *is* the bus.
   */
  devsa: {
    template: "devsa-partners.html",
    facts: ["Sept 28 – Oct 2", "Downtown San Antonio"],
    logos: [],
  },

  /**
   * The anchor room. No mark and no palette — see the note at the top of
   * tpr.html for why it still gets a template of its own rather than riding
   * the community one.
   *
   * Venue and street, where the other events give venue and floor. No day and
   * no time: they are not set yet, and the day cannot live here the way it
   * does for every other event because these speakers sit across Tuesday and
   * Thursday. When the slots land they go on each card as `facts`, which
   * overrides this. The talk's circuit is not a fact — it captions the ramp.
   */
  "cyber-ai-robotics-panel": CYBER_AI_ROBOTICS,

  tpr: {
    template: "tpr.html",
    facts: ["Texas Public Radio", "321 W Commerce St"],
    logos: [],
  },

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
      // 40, where the CMS ring took 84. Different file, different shape: the
      // lockup is 3.2:1, so 40 draws it 127 across — beside Tech Bloc rather
      // than over it, which is what a shared strip has to mean.
      { repo: "public/activations/the-creative-futures.webp", height: 40 },
      { partner: "Tech Bloc", height: 68 },
      { repo: "public/access-granted/orgs/devsa.png", height: 62 },
    ],
  },

  "the-model": {
    template: "the-model-pair.html",
    facts: ["Monday, September 28", "Geekdom, 3rd Floor"],
    // The first two come off the CMS partner wall, by name. The third is in
    // the repo. Heights are balanced by drawn area rather than by height: a
    // solid block and a wordmark on open ground read very differently at the
    // same height.
    //
    // Up by a third. The ratios between the three were right and the whole
    // strip was small: DEVSA drew at 46 here against 60 on Linux San Antonio,
    // 62 on Access Granted, 68 on Give-a-LOT and 72 on College Night — the
    // smallest instance of the same mark anywhere in the set, on the event
    // with the most partners to credit.
    logos: [
      // 40, where the CMS ring took 84. Different file, different shape: the
      // lockup is 3.2:1, so 40 draws it 127 across — beside Tech Bloc rather
      // than over it, which is what a shared strip has to mean.
      { repo: "public/activations/the-creative-futures.webp", height: 40 },
      { partner: "Tech Bloc", height: 68 },
      { repo: "public/access-granted/orgs/devsa.png", height: 62 },
    ],
  },

  /**
   * College Night — the one card in the set with no speaker on it.
   *
   * It is a room, not a running order: nothing is programmed between the
   * doors opening and closing, which is why the activation carries `spotlight`
   * rather than `programme` in lib/schedule.ts. So the card leads on the line
   * instead of on a face.
   */
  "college-night": {
    template: "college-night.html",
    facts: ["Tuesday, September 29  ·  4 – 6 PM", "The Rand, 3rd Floor"],
    // Both hosts are in the CMS partner wall, so both resolve by name.
    logos: [
      // Balanced by drawn area, not by height: Geekdom's is a wordmark that
      // fills its box, DEVSA's is a small glyph sitting in open space, so
      // matching heights drew DEVSA visibly the lighter of the two.
      // Geekdom's current mark, drawn white by the renderer rather than
      // swapped for a white file. The white one in public/brand is
      // og-geekdom.svg, the throwback wordmark from fifteen years ago — it is
      // the wrong logo, and being already-white is exactly what makes it a
      // trap. Same file and same treatment as the slug page.
      //
      // 62 against DEVSA's 72: at 2.83:1 this draws 175px wide to DEVSA's 96,
      // which lands the pair at the 1.55:1 area ratio the page has.
      { repo: "public/brand/geekdom.png", height: 62, white: true },
      { partner: "DEVSA", height: 72 },
    ],
  },

  /**
   * Give-a-LOT has a brand system of its own — a finished lockup, an amber,
   * and the transform table — so it gets a template, by the same rule that
   * gives PySanAntonio and The Model theirs.
   *
   * No speaker, like College Night: this is a drive and an afternoon, not a
   * talk. The four pairs are GIVE_A_LOT_STATES from lib/give-a-lot.ts, copied
   * here because the card tool does not import from the app.
   */
  "give-a-lot": {
    template: "give-a-lot.html",
    mark: { repo: "public/give-a-lot/lockup.svg", height: 216 },
    facts: [
      "Drop-off  ·  Sept 28 – Oct 1",
      "Friday, Oct 2  ·  12 – 2:30 PM",
      "Launch SA, Central Library",
    ],
    states: [
      ["vendor-locked", "linux + open source"],
      ["unsupported", "patched and current"],
      ["slow and tracked", "fast and private"],
      ["headed for landfill", "yours to keep"],
    ],
    // The order the band uses: the work, the room, the week.
    logos: [
      { repo: "public/give-a-lot/learnopentech.svg", height: 34 },
      { partner: "Launch SA", height: 40 },
      { repo: "public/access-granted/orgs/devsa.png", height: 68 },
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
    // The title landed, so it takes the headline and "Opening Keynote" drops
    // to the marker slot — which is the subtitle here, the same place
    // `linux-satx-speaker-beck` puts its own.
    //
    // Four lines, and the break splits "Software Engineering" because the
    // measure leaves no choice: at the set's 88 the longest line here is
    // "ADAPTING TO THE" at 618px, which is where `jordana-naftali` sits and
    // as far right as a headline goes before it reaches the figure. Held on
    // one line the phrase draws 824 and lands across his shoulder.
    headline:
      "Adapting to the<br />Evolution of<br />Software<br />Engineering",
    subtitle: "The opening keynote",
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
    id: "the-model-speaker-maria-consuelo-gonima",
    // Same shape as jonathan-perry: The Model's own facts, single-speaker
    // template borrowed off the keynote, because this is a talk inside the
    // afternoon rather than a fixed point in it.
    event: "the-model",
    template: "the-model.html",
    speaker: "maria-consuelo-gonima",
    eyebrow: "// The Model",
    // Her submitted title, split at its comma, with the panel taking the whole
    // first line — the thesis — and the second line running plain. Marking
    // "not just the product" instead would put the event's lavender on the
    // half the talk argues against, which read backwards.
    //
    // This is the one card in the set that opens on the panel; every other
    // sets a plain line first. It was ruled out for that while the template
    // was still setting headlines in Geist, where the wide grotesque made the
    // panel a slab across the card. Condensed it is a compact block ending
    // around x=570, and the objection goes with the width: it reads as a
    // marked phrase rather than a bar. The same change is why "not just the
    // product" fits underneath at full size — 773px against the 907 it drew
    // in Geist.
    headline:
      '<span class="hit">Ship the story,</span><br />not just the product',
    // 72. This was cut to 60 while the template was still setting headlines in
    // Geist, where "not just the product" and the solid panel behind it ran to
    // the right padding. Oswald is condensed and draws the same line about a
    // fifth narrower, so the size comes back up and the panel still ends well
    // inside the measure.
    headlineSize: 72,
    // Her portrait reaches further left than jonathan-perry's, so the copy
    // stops sooner: 620 leaves ~80px between the last character and her hair,
    // where the template's default 760 ran the text into her face.
    blurbWidth: 620,
    // Her opening line. It states the stake the headline leaves implicit —
    // the headline says what to ship, this says what happens if you do not.
    subtitle: "A brilliant product without a story<br />becomes invisible.",
    // The probe's worst miss in the set. It read her head+neck at 59.9% of
    // frame, which would make this the tightest crop here by half again — but
    // her hair runs well below the chin, so the shoulder line it watches for
    // arrives late and it measured most of her torso as head. Solving jonathan
    // -perry's 880 against that fiction gave 605 and drew her about half the
    // size he draws. Solved by eye against his card instead: 1030 matched his
    // head but brought her crown to within 35px of the headline, where his has
    // room to breathe, so 960 trades a little size back for that clearance.
    portrait: { height: 960, left: 439 },
  },

  {
    id: "the-model-speaker-jonathan-perry",
    // The Model's own facts — Monday, no hour — with the single-speaker
    // template borrowed off the keynote. Justin's card is the only other one
    // shaped like this, and his event exists to carry the 1:30 slot that is
    // his alone; Jonathan is a talk inside the afternoon, not a fixed point
    // in it.
    event: "the-model",
    template: "the-model.html",
    speaker: "jonathan-perry",
    eyebrow: "// The Model",
    // The lavender panel on the line that names the subject, which is the
    // event's signature and the reason its headlines are written to have one.
    // Here the subject is the machines.
    headline: 'Let the<br /><span class="hit">machines win</span>',
    headlineSize: 76,
    subtitle:
      "Embracing game engines and AI to accelerate development and content creation.",
    portrait: { height: 880, left: 500 },
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

  // ─── Community groups ─────────────────────────────────────────────────────
  {
    id: "gdg-speaker-hastimal-jangid",
    event: "google-developer-groups",
    speaker: "hastimal-jangid",
    headline: "Behind the Answer",
    headlineSize: 96,
    subtitle: "How LLMs and Google AI Search Work",
    portrait: { height: 903, left: 439 },
  },

  {
    id: "gdg-speaker-hastimal-jangid-wide",
    event: "google-developer-groups",
    speaker: "hastimal-jangid",
    // 1200x630, for the Meetup listing. The event's own facts and logos are
    // ignored by this template — see the note at the top of it for why.
    size: { width: 1200, height: 630 },
    template: "community-group-wide.html",
    headline: "Behind the Answer",
    headlineSize: 72,
    subtitle: "How LLMs and Google AI Search Work",
    // 34, not the portrait card's 46. This is a 10:1 wordmark sitting beside
    // the SASTW lockup rather than alone in a wordmark slot, and at 46 it drew
    // 470px against the lockup's 175 — the co-brand read as GDG's event that
    // Startup + Tech Week was attending.
    markHeight: 34,
    // Solved for a 630-tall frame, which the portrait card's numbers do not
    // survive: bottom-anchored at 903 the crown would sit 273px above the top
    // edge. His crown is 9.2% into his own frame, so 595 puts it at y=90,
    // clear under the co-brand row, and draws his head 226px — 36% of the
    // card's height, against 27% on the portrait card.
    portrait: { height: 595, left: 752 },
  },

  {
    id: "aws-speaker-daniel-morales-yusty",
    event: "aws-user-group",
    speaker: "daniel-felipe-morales-yusty",
    // 78px, not the default 88. At 88 the hook is 924px against a 936px
    // measure — it fits by 12px, which is not a margin, and breaking it in two
    // orphans "HACKER".
    headline: "The Autonomous Hacker",
    headlineSize: 78,
    subtitle: "Zero-Trust AI Pentesting on AWS",
    // Four words. The default split puts three of them on the second line and
    // runs it into the portrait; balanced two and two, both lines clear.
    name: ["Daniel Felipe", "Morales Yusty"],
    // A fuller crop than the rest — his head is 33.8% of the frame against
    // ~38% — so it takes a taller image to draw the same size head.
    portrait: { height: 1020, left: 410 },
  },

  {
    id: "datanauts-speaker-ednalyn-de-dios",
    event: "datanauts",
    speaker: "ednalyn-dd-de-dios",
    // 78, matching daniel-morales-yusty: same 21 characters, and the note
    // there is that 88 leaves a 12px margin, which is not a margin.
    headline: "Move Fast, Break Data",
    headlineSize: 78,
    subtitle: "A Situationship With the Truth",
    // The default split breaks after the quoted middle name and leaves the
    // opening quote alone at the head of the second line, which reads as a
    // stray mark rather than as part of her name.
    name: ["Ednalyn \u201cDd\u201d", "De Dios"],
    // The probe said 1261, and it is the worst miss in the set — it drew her
    // head at 42% of the card where the others run 21–30%. Her collar and
    // vest are near-black against a black ground, so the shoulder line it
    // watches for never arrives and it read most of her torso as head.
    //
    // Solved from the crown instead, the way the wide GDG card was. Her crown
    // is 8.4% into her own frame, so a bottom-anchored image sits it at
    // `1350 - 0.916 * height`: 900 puts it at 526, which is where Hastimal's
    // sits on the card this one runs beside.
    //
    // That fixes the head at ~400px, larger than his 285, and there is no
    // height that gives both — hers is a head-and-shoulders crop and his a
    // half-body, so her head is 46% of her frame against his 21%. 400 is
    // inside the shipped range: patrick-robinson is 409 off an equally tight
    // crop. The crown is the number worth matching, because it is the one a
    // reader compares across two cards in a feed.
    portrait: { height: 900, left: 439 },
  },

  {
    id: "datanauts-speaker-fouzan-aslam",
    event: "datanauts",
    speaker: "fouzan-aslam",
    // Split at the colon, as everywhere else. 72, not the default 88 or the
    // 78 its neighbours take: at 78 the hook draws 953px against a 936px
    // measure and wraps, and a two-line hook over a two-line subtitle is the
    // whole upper third.
    headline: "Scaling Executive Vision",
    headlineSize: 72,
    // The only two-line subtitle in the set, at 71 characters against the
    // ~30 the others run. It breaks after "with the" and clears his shoulder,
    // so it stays whole — this is the organiser's title and the half after
    // the colon is what says the talk is about a tool rather than a theme.
    subtitle:
      "Automated C-Suite Insights with the Data Intelligence Hub Deck Generator",
    // Solved from the crown, like the two cards this runs beside rather than
    // from the probe's 710. His crown is 6.4% into his frame, so
    // `1350 - 0.936 * height` puts 881 at y=526 — where Hastimal's and
    // Ednalyn's sit. The probe's own head reading is trustworthy here (40% of
    // frame, against the 34–38% the set runs) because his suit separates
    // cleanly from the ground, and at 881 it draws ~325px, mid-range.
    portrait: { height: 881, left: 439 },
  },

  {
    id: "datanauts-meetup",
    event: "datanauts",
    // 1200x630 and no speaker — the group's card for the whole session rather
    // than either talk's. See the note at the top of the template.
    size: { width: 1200, height: 630 },
    template: "community-group-bill.html",
    // Drawn at 2x — see `scale` in render.mjs. These are posted and re-cropped
    // rather than unfurled at a fixed size.
    scale: 2,
    // 78, against the portrait card's 62 — the mark is the subject here
    // rather than a badge over a face. The lockup takes the same number:
    // Datanauts is a helmet and a wordmark at close to the lockup's own
    // proportion, so equal heights draw an equal pair.
    markHeight: 78,
    lockupHeight: 108,
    talks: [
      {
        title: "Move Fast, Break Data",
        subtitle: "A Situationship With the Truth",
        who: "Ednalyn \u201cDd\u201d De Dios",
      },
      {
        title: "Scaling Executive Vision",
        subtitle:
          "Automated C-Suite Insights with the Data Intelligence Hub Deck Generator",
        who: "Fouzan Aslam",
      },
    ],
  },

  {
    id: "gdg-meetup",
    event: "google-developer-groups",
    size: { width: 1200, height: 630 },
    template: "community-group-bill.html",
    // Drawn at 2x — see `scale` in render.mjs. These are posted and re-cropped
    // rather than unfurled at a fixed size.
    scale: 2,
    // Balanced on drawn width, not height — the pair rule this template's
    // note sets out. GDG is a 10:1 wordmark, so 39 draws it ~390px, which is
    // what the lockup draws at 108. Matched on height instead it would be
    // 780px against 310 and read as the week appearing at GDG's meetup.
    markHeight: 39,
    lockupHeight: 108,
    talks: [
      {
        title: "Behind the Answer",
        subtitle: "How LLMs and Google AI Search Work",
        who: "Hastimal Jangid",
      },
    ],
  },

  {
    id: "aws-meetup",
    event: "aws-user-group",
    size: { width: 1200, height: 630 },
    template: "community-group-bill.html",
    // Drawn at 2x — see `scale` in render.mjs. These are posted and re-cropped
    // rather than unfurled at a fixed size.
    scale: 2,
    // 5.49:1, so 71 draws ~390 — the same width the other two marks take.
    markHeight: 71,
    lockupHeight: 108,
    // Measured, not guessed: on the unshifted card the lockup's caps run
    // y92–124 and AWS's run y74–106, because the smile hangs below the
    // letters and pulls the file's centre down past them. 18 puts the two
    // baselines on the same line.
    markShift: 18,
    talks: [
      {
        title: "The Autonomous Hacker",
        subtitle: "Zero-Trust AI Pentesting on AWS",
        who: "Daniel Felipe Morales Yusty",
      },
    ],
  },

  /**
   * The four event cards.
   *
   * Every other card for these activations is one speaker's. That is right
   * for a speaker announcement and wrong for the post that says what the week
   * *is*: four speaker cards in a carousel read as four people, and they spend
   * the cards you were holding for later. College Night and Give-a-LOT have
   * had event cards from the start — they have no speaker to lead with — so
   * the shape was already proven; these four just needed the templates to
   * tolerate a card that names nobody.
   *
   * Copy comes from each event's own source, not from new writing: Access
   * Granted's and The Model's two-part hooks are in lib/access-granted.ts and
   * lib/the-model.ts, and the other two come off their `blurb` in
   * lib/schedule.ts.
   *
   * `facts` are per card because three of these events carry a day and a floor
   * and no hour, which is the one fact a "come to this" post needs. Their
   * venue strings are left as each event has them — Geekdom for three of
   * these, The Rand for Linux San Antonio — so an event's own cards agree with
   * each other. They are the same floor of the same building and the two
   * spellings are worth reconciling, but not silently and not here, because
   * the speaker cards already shipped with them.
   */
  {
    id: "access-granted-event",
    event: "access-granted",
    art: "public/access-granted/padlock.png",
    // Their own one-liner, split across the two slots it was written for.
    headline: "Taking it<br />apart.",
    headlineSize: 118,
    subtitle: "Every other room this week is people talking about technology.",
    facts: ["Wednesday, September 30  ·  1 – 6 PM", "Geekdom, 3rd Floor"],
    portrait: { height: 980, left: 470 },
  },

  {
    id: "the-model-event",
    event: "the-model",
    art: "public/the-model/key-art.png",
    // Explicit, because The Model's *event* default is `the-model-pair.html`
    // — the two-speaker layout — and its single-speaker cards each name
    // `the-model.html` themselves. Without this the event card renders through
    // the pair template, which hardcodes its own eyebrow, positions portraits
    // by `top` rather than `left`, and drops the blurb.
    template: "the-model.html",
    // "// The Model", like every card on this template — the eyebrow is where
    // it names itself, since the template draws no wordmark of its own.
    eyebrow: "// The Model",
    headline: "What comes<br />next.",
    // 76, the size its speaker cards use. 118 is Access Granted's, and this
    // template's measure is narrower.
    headlineSize: 76,
    subtitle: "Creatives, founders and developers in the same room.",
    facts: ["Monday, September 28  ·  1 – 6 PM", "Geekdom, 3rd Floor"],
    // Not a person's numbers. The key art is a wide illustration with deep
    // transparent margin, and the template's scrim runs solid black to 20% of
    // the width and clears at 52% — so at a portrait's `left: 500` the art was
    // half painted out and half off the right edge. Placed clear of both.
    portrait: { height: 690, left: 452 },
  },

  {
    id: "pysanantonio-event",
    event: "pysanantonio",
    art: "public/pysa/mascot-block.webp",
    // A block, not a cutout. Every other `art` and every headshot here is
    // matted; this one is a rectangle of opaque #0a0a0a with a feathered
    // edge, so it lands on the card as flat black over a graded ground and
    // paints the bloom out where it covers it. The flag lifts the bloom over
    // the picture instead of behind it — the same fix, and the same numbers,
    // as the motion card, whose footage has the same flat ground.
    artBlock: true,
    headline: "Back for a<br />second run.",
    headlineSize: 104,
    subtitle:
      "The city\u2019s Python conference \u2014 talks, workshops, and the people who build with it every day.",
    facts: ["Friday, October 2  ·  1 – 6 PM", "Geekdom, 3rd Floor"],
    portrait: { height: 760, left: 520 },
  },

  {
    id: "pysanantonio-motion",
    event: "pysanantonio",
    // 1, not the 2 the stills take. A still is posted and re-cropped, so it
    // wants the sample rate; a video is transcoded by every platform it
    // touches, so the extra pixels buy nothing and cost 12MB against 3.
    scale: 1,
    headline: "Back for a<br />second run.",
    headlineSize: 104,
    subtitle:
      "The city\u2019s Python conference \u2014 talks, workshops, and the people who build with it every day.",
    facts: ["Friday, October 2  ·  1 – 6 PM", "Geekdom, 3rd Floor"],
    /**
     * The one card here that moves.
     *
     * `pysa2-loop.mp4` is 1114x720 and this frame is 1080x1350, so the clip
     * is placed rather than fitted: scaled to 1000 tall and offset left, it
     * puts the figure in the right half where the still event card puts the
     * mascot, with its feet near the floor. The numbers are the same kind of
     * thing as `portrait.height` and `portrait.left` and solved the same way
     * — by eye, against the card.
     *
     * Two plays of a seven-second loop. Long enough to read the card, short
     * enough that a feed will loop it rather than treat it as a video someone
     * has to choose to watch.
     */
    video: {
      src: "public/pysa/pysa2-loop.mp4",
      // Solved against the still card rather than against the frame, and
      // measured rather than judged: the mascot's sombrero brim is 404px
      // across on `pysanantonio-event`, spanning x598–1002, and these three
      // numbers put the clip's brim at 405px across x599–1004. The two cards
      // carry the same figure at the same size in the same place, which is
      // the point of running them as a pair.
      //
      // The first pass drew him at 600 tall — 314px of brim, 78% of the
      // still's — which left a wide field of empty black down the right of
      // the card and made the video read as the smaller of the two. Before
      // that, at 1000, his sombrero ran into the headline.
      height: 772,
      x: 110,
      y: 588,
      loops: 1,
      seconds: 14.2,
    },
  },

  {
    id: "linux-satx-event",
    event: "linux-satx",
    // No art: Linux San Antonio has no figure or key image in the repo, and
    // the guard drops the portrait column rather than drawing a hole. Its
    // mark already leads the card from the wordmark slot.
    headline: "The people who<br />actually run Linux.",
    headlineSize: 82,
    subtitle:
      "Two hours on the community floor \u2014 the environment, the tooling, the config you keep tuning.",
  },

  // ─── DEVSA ────────────────────────────────────────────────────────────────
  {
    id: "devsa-powers-the-week",
    event: "devsa",
    size: { width: 1080, height: 1350 },
    scale: 2,
    // "Community-driven activations" first, then "Community-driven" — the
    // noun was the over-claim the bands below exist to avoid, since five of
    // these marks are standing groups that meet every month.
    //
    // What replaced it is the fact the card could not previously state. The
    // "+ Tech" is new this year; DEVSA was brought in to run it; the twelve
    // activations below are its first programme. Without that, "DEVSA powers
    // Tech Week" over a field of marks reads as a sponsorship claim on an
    // event that has always existed. With it, the same headline is a
    // division of labour and the card becomes news. "Year one" also answers
    // the week's own hero, which leads on "Year 11".
    eyebrow: "Year one of the + Tech",
    // No count. An earlier cut led on "Eleven activations", and a number is
    // the wrong subject for this card: it invites the reader to check it, it
    // goes stale the week another lands, and it says nothing about who
    // convened them. The claim is the collaboration, and the field of marks
    // below is the evidence — which is a stronger argument than counting it.
    // "Tech Week", not "the week". Every mark below it is a tech group or
    // a tech partner, so the specific name is the true one — and the lockup
    // directly above still carries "Startup + Tech Week" whole, so the card
    // is not dropping half the event's name, only using the half these
    // twenty-three belong to.
    headline: 'DEVSA powers<br /><span class="hit">Tech Week.</span>',
    marks: DEVSA_MARKS,
    splits: DEVSA_SPLITS,
  },

  {
    id: "devsa-powers-the-week-wide",
    event: "devsa",
    size: { width: 1920, height: 1080 },
    template: "devsa-partners-wide.html",
    scale: 2,
    eyebrow: "Year one of the + Tech",
    headline: 'DEVSA powers <span class="hit">Tech Week.</span>',
    marks: DEVSA_MARKS,
    splits: DEVSA_SPLITS,
  },

  /**
   * The same poster, for the groups to post.
   *
   * The announcement card says DEVSA powers the week, which is the right
   * claim from DEVSA's account and the wrong one from anybody else's — a
   * group resharing it is posting a card about its host. This one moves the
   * subject to the collective, so the same twenty-three marks work under a
   * caption that begins "proud to be part of this".
   *
   * The co-brand stays. DEVSA convened these and the week is the week; what
   * changes is the sentence, not who is credited.
   */
  {
    id: "devsa-community-reshare",
    event: "devsa",
    size: { width: 1080, height: 1350 },
    template: "devsa-partners.html",
    scale: 2,
    eyebrow: "Year one of the + Tech",
    headline: 'The community<br /><span class="hit">powers Tech Week.</span>',
    marks: DEVSA_MARKS,
    splits: DEVSA_SPLITS,
  },

  /**
   * The carousel, one band a slide.
   *
   * `devsa-powers-the-week` is the poster and stays slide one. These are for
   * the swipe after it: at 1080 wide a mark on the poster draws ~66px, which
   * in a feed rendering ~400px across is 20px — the wordmarks survive and the
   * badges do not. A band with the frame to itself draws its marks about
   * three times larger.
   *
   * Each also stands alone, which is the point for the groups: reposting
   * "Invited to the week" is posting a card about yourself rather than a crop
   * of somebody else's.
   */
  /**
   * The other half of the turn card's argument, on the same template.
   *
   * `devsa-a-seat-at-the-table` says the room opened. This one says what is
   * in it, and then how it got there — the reader-facing claim on top, the
   * organisational story behind the rule, which is the shape that template
   * exists for.
   *
   * It carries no marks, and that is the point of the rewrite. An earlier cut
   * led on "23 organizations said yes" over a field of all twenty-three
   * logos; `devsa-powers-the-week`, its reshare and the three carousel slides
   * already do exactly that, four times over. A fifth card of logos adds a
   * fifth copy of one argument where the set is short of the other one.
   */
  {
    id: "devsa-zero-pitch",
    event: "devsa",
    template: "devsa-turn.html",
    size: { width: 1080, height: 1350 },
    scale: 2,
    eyebrow: "What the “+ Tech” actually means",
    // 168, the largest headline in the set, where the other card on this
    // template runs 120. Eleven characters is what buys it: this face draws
    // 0.468em each, so "HARD PARTS." fills 865 of the 936px measure at 168.
    headlineSize: 168,
    // "Zero-pitch sessions." was the headline, and it was the one line on
    // these cards that could be read backwards. In the technical community
    // zero-pitch means no vendor deck inside the talk; on a card carrying the
    // Startup + Tech Week lockup, "pitch" means Mission Pitch, Latin Tech
    // Pitch and Stumberg — three stages this week actually runs, none of them
    // DEVSA's. At 140px the wrong reading won, and it read as the week having
    // dropped its pitch competitions.
    //
    // So the phrase moves into the subtitle, where "zero-pitch technical
    // talks" carries its own qualifier, and the sentence after it says the
    // pitch stages run. The headline takes the positive half of the same
    // message, which cannot be read two ways.
    // An invitation, not a claim — which is what makes it safe on a card
    // co-branded with a week that runs three pitch stages. "Pure technical
    // depth" was accurate and was a category label; this names the thing a
    // technical speaker has spent ten years cutting out of a talk. It also
    // answers the card beside it: `devsa-a-seat-at-the-table` says the week
    // wasn't built for you, and this one says what to bring now that it is.
    headline: 'Bring the<br /><span class="hit">hard parts.</span>',
    subtitle:
      "Real workflows and zero-pitch technical talks, no longer re-framed for a founder audience. The week’s pitch stages still run — these are the tech rooms.",
    turnLabel: "How it happened",
    // "It didn't take a multi-million dollar budget" was here, and it was the
    // one ungenerous line on a card whose argument is generosity — a reader
    // asks who it is aimed at, four lines above the organisations that made
    // it happen. "It didn't need another room" makes the same point about
    // organising rather than spending, and it is DEVSA's own line: the
    // coworking letter says putting up more square footage downtown would
    // only fragment a community trying to consolidate.
    turnBody:
      "DEVSA didn’t build a new conference. We mobilized our community into an existing 11-year platform because 23 local organizations said yes. It didn’t need another room — just one dedicated bridge, organizing from the frontlines.",
  },

  {
    id: "devsa-a-seat-at-the-table",
    event: "devsa",
    template: "devsa-turn.html",
    size: { width: 1080, height: 1350 },
    scale: 2,
    eyebrow: "Developers · hackers · active learners",
    headlineSize: 120,
    headline:
      'For 10 years,<br />this week wasn’t<br /><span class="hit">built for you.</span>',
    subtitle:
      "Startup Week was geared toward founders, pitch decks, capital and small business strategy.",
    // Sourced, clause by clause. An earlier cut read "Geekdom recognized the
    // gap: San Antonio's technical ecosystem needed its own dedicated seat at
    // the table" — true as far as DEVSA knows, and nowhere in anything
    // Geekdom has published, which makes it DEVSA narrating a partner's
    // reasoning on DEVSA's own channel. What Geekdom has said publicly is
    // the club and its audience, in those words; what DEVSA can assert is
    // its own invitation. The card now claims only those two things, and
    // together they say more than the sentence they replaced.
    turnLabel: "This year",
    turnBody:
      "Geekdom is becoming a membership club for serious founders and builders. Startup + Tech Week is the first event of that new direction, and they tagged DEVSA in so the technical community was in it from the start.",
  },

  {
    id: "devsa-slide-built",
    event: "devsa",
    size: { width: 1080, height: 1350 },
    template: "devsa-band.html",
    scale: 2,
    eyebrow: "DEVSA powers Tech Week",
    headline: 'Built for<br /><span class="hit">the week.</span>',
    marks: DEVSA_BUILT,
    cols: 2,
    cellH: 112,
  },

  {
    id: "devsa-slide-invited",
    event: "devsa",
    size: { width: 1080, height: 1350 },
    template: "devsa-band.html",
    scale: 2,
    eyebrow: "DEVSA powers Tech Week",
    headline: 'Invited to<br /><span class="hit">the week.</span>',
    marks: DEVSA_INVITED,
    cols: 2,
    cellH: 112,
  },

  {
    id: "devsa-slide-partners",
    event: "devsa",
    size: { width: 1080, height: 1350 },
    template: "devsa-band.html",
    scale: 2,
    eyebrow: "DEVSA powers Tech Week",
    // Eleven, so three across rather than two — at two it is six rows and the
    // marks come back down to the poster's size, which defeats the slide.
    headline: 'The partners<br /><span class="hit">behind them.</span>',
    marks: DEVSA_PARTNERS,
    cols: 3,
    cellH: 96,
  },

  // ─── Texas Public Radio ───────────────────────────────────────────────────
  {
    id: "cyber-ai-robotics-panel",
    event: "cyber-ai-robotics-panel",
    // "The" is dropped and the title splits at its own clause. Whole and
    // unbroken it is 41 characters, which at this size reaches past the
    // measure; the three technologies are the hook and go first.
    headline: "Cyber, AI & Robotics<br />Convergence Panel",
    headlineSize: 76,
    // The same line the activation page leads on, which is what the panel is
    // actually about rather than a restatement of its title.
    subtitle: "Three technologies, one patent question.",
  },

  {
    id: "tpr-speaker-patrick-robinson",
    event: "tpr",
    speaker: "patrick-robinson",
    // Split at the colon, as on samad-ahmed. "AI PRODUCT THINKING" whole
    // would wrap the headline to three lines against the ramp above it.
    headline: "Speed to Value",
    headlineSize: 106,
    subtitle: "AI Product Thinking",
    // One of the five named in lib/tracks.ts — the card must not invent a
    // sixth. The ramp above says all five land here; this says which one the
    // talk runs on.
    circuit: "AI & Applied Innovation",
    // The tightest crop in the set — his head is 46% of its frame where the
    // rest run 34–38% — so it takes the shortest image to draw the same size
    // head. The probe said 615; his beard reaches the collar and delays the
    // shoulder line it looks for, so it read the head as longer than it draws
    // and undersized this by about 10%.
    portrait: { height: 890, left: 430 },
  },

  {
    id: "tpr-speaker-sandra-velasquez",
    event: "tpr",
    speaker: "sandra-velasquez",
    // The CMS title, whole — the half after the colon is "A Founder Fireside
    // Chat with Sandra Velasquez", and her name is already the largest thing
    // in the lower third, so the subtitle drops it.
    headline: "Building Nopalera<br />on Her Own Terms",
    subtitle: "A Founder Fireside Chat",
    // From her session record's `track`, not read off the title.
    circuit: "Founder",
    // Her slot is set — Tuesday 1:00–1:30 PM — and deliberately not on the
    // card.
    //
    // The one portrait in the set the probe cannot read at all: it takes the
    // crown off the alpha channel, and the top of this frame is the brim of a
    // hat, so it measured a 521px "head" that is really about 230. Its 736
    // would have drawn her at roughly half the intended size.
    //
    // Nor can she match the set's ~370px head — she is seated and three-
    // quarter length, so the height that would do it puts the hat off the top
    // of the card. The hat is the cap: 940 lands its brim at y=483, just
    // clear of the subtitle. Same compromise as edwin-jung, the set's other
    // full-body cutout.
    portrait: { height: 940, left: 470 },
  },

  {
    id: "tpr-speaker-crystal-poenisch",
    event: "tpr",
    speaker: "crystal-poenisch",
    // The title is a contrast, so the break falls on the "vs." rather than
    // mid-clause, and there is no subtitle — the whole line is the hook.
    headline: "Securing Things<br />vs. Securing People",
    circuit: "Founder",
    // No session record yet, so no slot. The circuit is the one you gave.
    //
    // The long-hair case the probe warns about, at its worst: her hair covers
    // the neck completely, so the shoulder line it watches for never arrives
    // where the chin is. It read a 570px head that is really about 484, and
    // its 673 would have drawn her a third small.
    portrait: { height: 940, left: 470 },
  },

  {
    id: "tpr-speaker-jennifer-fite",
    event: "tpr",
    speaker: "jennifer-fite-ph-d",
    headline: "Nobody Signed Up<br />to Govern a Robot",
    circuit: "Tech & Builders",
    // No session record yet, so no slot; the circuit is the one you gave.
    // Her framing matches crystal-poenisch closely enough to share her
    // numbers — same head-and-shoulders crop, crown 107px in against 126,
    // and the same long hair that makes the probe's 765 unusable.
    portrait: { height: 940, left: 470 },
  },

  {
    id: "tpr-speaker-wolfy",
    event: "tpr",
    speaker: "wolfy",
    // The talk was retitled and re-tracked after this card was first made: it
    // ran as "Cybersecurity for Small Businesses" on Small Business &
    // Solopreneur, and the session record now reads this, on Founder. Updated
    // in place rather than added alongside — a second card would leave the old
    // one in the set to be re-exported later, which is the exact failure the
    // note at the top of this file exists to prevent.
    //
    // Split at the colon, as on patrick-robinson. "Tea" is the 2025 app breach
    // his abstract opens on, so the hook only works whole and lands the line.
    headline: "Don\u2019t Be the<br />Next Tea",
    headlineSize: 106,
    subtitle: "Defense in Depth for Founders",
    // From the session record, not guessed. The CMS titles it "…For Founders"
    // with a capital F; the subtitle above sets it in title case.
    circuit: "Founder",
    // He goes by one name — the first the set has had. See the note on
    // .name in tpr.html for what the renderer's default split did with that.
    //
    // The probe's crown is the brim of a DEF CON cap rather than his head,
    // which for once is right: the cap is the top of the silhouette, so it is
    // what has to line up with the other cards. Its 713 is still short.
    portrait: { height: 940, left: 470 },
  },

  {
    id: "tpr-speaker-dirce-hernandez",
    event: "tpr",
    speaker: "dirce-eduardo-hernandez",
    // The longest title in the set at 68 characters, and it does not split:
    // there is no colon, and the one natural break falls inside the list
    // "Security Operations, Intelligence, and GRC", which leaves any subtitle
    // starting on a fragment. So it runs whole, three lines at 68px — the
    // only card here whose headline is not the set's 88 or larger. The breaks
    // fall on the commas, so the list reads as a list.
    headline:
      "Reinventing Security<br />Operations, Intelligence,<br />and GRC for the AI Era",
    headlineSize: 68,
    circuit: "AI & Applied Innovation",
    // No company on his record, so the card runs the no-org path — the one
    // that needs `.role`'s conditional margin. jordana-naftali is the other.
    //
    // Crown 66px into the frame, the highest in the set, so the same drawn
    // head takes a shorter image than anyone else here: 845 against the 940
    // the other long-hair crops use.
    portrait: { height: 845, left: 500 },
  },

  {
    id: "tpr-speaker-daniel-ward",
    event: "tpr",
    speaker: "daniel-ward",
    // Split on the dash, which does the work a colon does on the other cards:
    // the hook in front, the payoff behind.
    headline: "Lessons From a Year<br />of AI Coaching",
    subtitle: "What Actually Changed",
    circuit: "AI & Applied Innovation",
    // No session record yet, so no slot. Crown 85px in, a standard
    // head-and-shoulders crop; 890 lands his head at 320px, the same as
    // wolfy. The probe's 662 is short by the usual margin — his beard reaches
    // the collar, which is the case it cannot read.
    portrait: { height: 890, left: 470 },
  },

  /**
   * The first card in the set to credit a sponsor on the talk rather than the
   * event. Google for Startups paid for this slot; TPR itself is hosted by the
   * week, which is why `tpr` carries `logos: []` and the strip in tpr.html is
   * guarded — the other eight cards on this stage draw nothing.
   *
   * The mark is the trimmed cut from lib/sponsor-marks, not the CMS file. The
   * CMS artwork arrives with 12.8px of transparent padding down its left edge
   * at a 32px render, which inside a flex row is space no `gap` can close. It
   * is also already pure white and carries no colour at all — measured, 0% of
   * its opaque pixels are chromatic — so it needs no `white: true` on this
   * black ground.
   */
  {
    id: "tpr-speaker-vibha-kurpad",
    event: "tpr",
    speaker: "vibha-kurpad",
    // No colon and no dash to split on, and the phrase is one idea, so it runs
    // whole over three lines rather than being cut into a headline and a
    // subtitle that would misquote it. "Modern AI Landscape" is the unit and
    // stays together; the breaks fall either side of it.
    headline: "The Founder\u2019s Guide<br />to the Modern<br />AI Landscape",
    // From her session record. This was guessed as AI & Applied Innovation
    // while the talk had no record to read — the subject looked like the
    // answer. The programme files it under Tech & Builders, which the card now
    // follows; a circuit is the programme's to state, not the card's to infer.
    circuit: "Tech & Builders",
    poweredLabel: "Presented by",
    logos: [
      { repo: "public/brand/google-for-startups-wordmark.png", height: 44 },
    ],
    // The probe's 837 undersized her by the margin the README warns about:
    // her hair covers the neck, so the shoulder line it watches for never
    // arrives where the chin is and it measured a head longer than she draws.
    // Crystal and Jennifer are the same case and sit at 940. 920 lands her
    // head level with daniel-ward, which is the card this one sits beside.
    portrait: { height: 920, left: 439 },
  },

  {
    id: "tpr-speaker-luis-martinez",
    event: "tpr",
    speaker: "luis-martinez-ph-d",
    // Splits at the colon, the way patrick-robinson and daniel-ward do: the
    // hook in front, the question behind. Short enough to run at 106.
    headline: "The Truth<br />About Startups",
    headlineSize: 106,
    subtitle: "What Are You Going to Do About It?",
    // From his session record, and it agrees with what this was set to while
    // the talk had none: filed on who the talk is for rather than on the
    // Capital Factory masthead of the man giving it.
    circuit: "Founder",
    // The second-tightest crop in the set at 44.3% of frame, just behind
    // patrick-robinson's 46%, so it takes a short image to draw the head at
    // the size the others do. The probe's 641 is far too short even for that;
    // 900 was 10% too large, measured against patrick and daniel-ward side by
    // side. 830 puts his head level with both.
    portrait: { height: 830, left: 439 },
    // No sponsor on this one, so no `logos` — the strip and the shallower
    // bottom padding both stay off. See tpr-speaker-vibha-kurpad.
  },

  {
    id: "tpr-speaker-wes-etheredge",
    event: "tpr",
    speaker: "wes-etheredge",
    // Short enough to run at 106 like speed-to-value, and the ratio is the
    // hook, so it leads the line rather than getting buried mid-sentence.
    headline: "The New 80/20<br />of Coding With AI",
    headlineSize: 106,
    circuit: "AI & Applied Innovation",
    // No company on his record, so this is the no-org path again.
    //
    // Third headshot, third re-derivation — the numbers are a function of
    // where he sits in his own frame, so none of them survive a swap. The
    // first was the widest crop in the set (27% of frame) and had to be
    // capped by the crown at 950, drawing his head 259px against the set's
    // ~320. The two since are tight crops that need no compromise: this one
    // is 37%, and 920 lands the crown at y=518 with the head at 341.
    portrait: { height: 920, left: 470 },
  },

  // ─── College Night ────────────────────────────────────────────────────────
  {
    id: "college-night",
    event: "college-night",
    // No speaker, no portrait. See the event entry above.
    //
    // "Night" in magenta, because the site does the same: `titleAccent` on
    // this activation in lib/schedule.ts puts the accent on the second word,
    // so the card and the page wear the same mark.
    headline: 'College<br /><span class="hit">Night</span>',
    // Back up to 172 now that the hook is off the card. The subtitle was
    // paying for the smaller title, and with three blocks of prose gone to
    // two the card can lead on type again.
    headlineSize: 172,
    // `detail.headline` on the activation, verbatim — the page sets it under
    // the title in the same face, so the two open the same way.
    deck: "Bring the whole club.",
    // No subtitle. The page's hook — "Every computing student in San
    // Antonio, community college and university alike. Two hours, one room."
    // — is right on the page and wrong here: three blocks of prose under a
    // title made the card read as a paragraph with a headline on it. The deck
    // says who to bring, the quote says who it is for, and the facts say
    // when. The hook was the one saying the least the other three did not.
    // The subjects, not the page's "no home campus … no one is checking which
    // logo is on your student ID". That line is the warmer one and it stays on
    // the page, but on the card it argued the same thing as the access line
    // below it — no gatekeeping, said twice, and said more completely down
    // there. This answers the question nothing else on the card does: is this
    // my field. A list also scans in a feed where a sentence does not.
    //
    // Not the schools list, which was the other candidate: six proper nouns is
    // a lot of noise, and naming institutions implies a list you have to be on
    // — the opposite of the point.
    // Non-breaking spaces inside "any of it" — at this column the balancer
    // split the phrase across lines, leaving "— any" hanging. Bound, it moves
    // whole to the last line and the break falls on the em dash instead.
    quote:
      "Computer science, AI, cybersecurity, data and electrical engineering \u2014 any\u00a0of\u00a0it, at any campus in San Antonio.",
    // Both of the above and this one are the page's words exactly — the two
    // surfaces are read by the same person, often minutes apart, and a list
    // that gains or loses an item between them reads as one of the two being
    // out of date. The page shortened "data engineering, electrical
    // engineering" to "data and electrical engineering" and traded the long
    // conditions sentence for this one; the card follows.
    access:
      "Free, no badge, no pitch, and nobody checking which logo is on your student ID.",
  },

  {
    id: "linux-satx-speaker-beck",
    event: "linux-satx",
    speaker: "beck",
    // Tentative — his words. If it firms up, this and the subtitle are the
    // only two strings that change.
    headline: "From Closed to Open",
    headlineSize: 96,
    subtitle: "The opening keynote",
    greyscale: true,
    // The second mononym in the set, after wolfy. See the note on `.name` in
    // community-group.html for what the default split did with it.
    //
    // The probe is unusable here and wrong in the opposite direction to
    // usual: it reported a 218px head, 16% of frame, because his top knot
    // widens the silhouette immediately and the shoulder test fires at the
    // hairline. Its 1759 would have drawn him about twice life size. Solved
    // from the crown instead — and the crown that matters is the knot, since
    // that is where the silhouette starts.
    portrait: { height: 840, left: 470 },
  },

  {
    id: "linux-satx-speaker-paul-christiansen",
    event: "linux-satx",
    speaker: "paul-christiansen",
    // Split before the possessive so both halves are a phrase — "I Spy With
    // My / Kernel Eye" breaks the joke across the line it turns on.
    headline: "I Spy With<br />My Kernel Eye",
    headlineSize: 96,
    // The parenthetical from the title, which is the half that says what the
    // talk is actually about.
    subtitle: "What your box is doing before you ever log in",
    // No company on his record — the no-org path, like jordana-naftali. His
    // role comes off the CMS, which now reads "Security Engineer · Kernel &
    // eBPF" rather than "SAP GRC Automation", so the card needs no override.
    //
    // Re-derived for a replaced headshot. The new one is a wider crop — his
    // head is 27% of the frame against 30% — and he is holding a dog, which
    // is the reason the crop opened up. 860 is the ceiling rather than a
    // choice: the crown lands at y=556 and the subtitle ends at 535, so
    // anything taller puts his hair into the type.
    portrait: { height: 860, left: 439 },
  },

  // ─── Give-a-LOT ───────────────────────────────────────────────────────────
  {
    id: "give-a-lot",
    event: "give-a-lot",
    // The page's own line, and the one that speaks to both readers — this
    // event asks two different people to do two different things.
    headline: "Bring a machine.<br />Take one home.",
    headlineSize: 88,
    // The amber line, and the argument the table under it proves. Same words
    // as GIVE_A_LOT.tagline on the page — the two surfaces open alike.
    subtitle: "Nothing here is junk.",
  },

  // ─── Access Granted ───────────────────────────────────────────────────────
  /**
   * The two posters, rebuilt as cards.
   *
   * Both existed only as exported PNGs from before this directory did, which
   * cost exactly what that always costs: when The Creative Futures logo turned
   * out to be wrong, the fix was compositing a new one into a JPEG rather than
   * changing a line and re-rendering. These are the same two designs on a
   * shared template so the next change is a line.
   *
   * They are rebuilt, not traced. The originals are the reference for
   * composition and copy; the numbers were re-solved against the layout, and
   * the strip's alignment was fixed on the way rather than reproduced.
   */
  {
    id: "access-granted-poster",
    event: "access-granted",
    template: "activation-poster.html",
    accent: "#00ff66",
    art: "public/access-granted/padlock.png",
    artWidth: 470,
    // DEVSA and the lockup, where the other poster carries the dates.
    cobrand: true,
    week: false,
    devsaHeight: 52,
    // 56, where the original drew 40. The brief was "larger" and this is the
    // ceiling that still reads as a co-brand rather than a title: at 56 the
    // lockup draws 274 across against DEVSA's 80, which is the widest it can
    // go before the row reads as the week's poster carrying a partner mark
    // instead of the two organisations standing together.
    lockupHeight: 56,
    headline: '<span class="hit">Access</span><br />Granted',
    headlineSize: 138,
    subtitle:
      "Every other room this week is people talking about technology. This one is people taking it apart.",
    poweredLabel: "Powered by San Antonio’s security community",
    // The coalition without DEVSA — it is in the co-brand row above, and a
    // mark that appears twice on one card reads as two organisations.
    //
    // Heights are drawn heights, evened to ~92 for the dense badges and held
    // higher for the two that carry a caption under a light graphic. The two
    // `shift` values are the measured error on the original: CyberJedis sat
    // 7.5px below the row's axis and Locksport 3px above it, because both
    // files centre on a box that includes their caption.
    logos: [
      { repo: "public/access-granted/orgs/bsides.png", height: 92 },
      { repo: "public/access-granted/orgs/defcon.png", height: 90 },
      { repo: "public/access-granted/orgs/saha.png", height: 68 },
      // 117 and 110 against the 92 above them, because `height` is the file's
      // and these two files are mostly margin: at a shared 90 CyberJedis drew
      // 74 of ink and Locksport 48, against BSides' 92. Solved to the drawn
      // sizes the original poster was approved at — 93 and 66 tall.
      // …and then `shift`, because sizing them correctly is what exposes the
      // original defect: both files put a caption under the graphic, so the
      // box centres 11.5px and 3px away from what a reader sees as the mark.
      // Measured off the render, not guessed.
      {
        repo: "public/access-granted/orgs/cyberjedis.png",
        height: 117,
        shift: -11,
      },
      {
        repo: "public/access-granted/orgs/locksport.png",
        height: 110,
        shift: 3,
      },
    ],
  },

  {
    id: "the-model-poster",
    event: "the-model",
    template: "activation-poster.html",
    accent: "#c0b4fc",
    // A still of the live component, not a picture of one — `ModelFlow` on
    // the activation's own page, captured at 2x. The same relationship
    // `bolt-current-og.png` has to the WebGL hero, and the reason this poster
    // could not be rebuilt until now: its art was never a file. What is in
    // `public/the-model/` is `code-select.png`, a different graphic.
    art: "public/the-model/node-graph.png",
    artWidth: 880,
    eyebrow: "// The Rand · AI & Applied Innovation",
    // The lockup is this poster's only mark — Access Granted gives the row's
    // left half to DEVSA, and this one gives its right half to the dates.
    lockupHeight: 40,
    // Figure and ground, not two colours of ink: "MODEL" is knocked out of a
    // lavender panel, which is this event's own device and the reason the
    // template carries `.panel` as well as `.hit`.
    headline: 'The <span class="panel">Model</span>',
    headlineSize: 130,
    subtitle:
      "Creatives, founders and developers in the same room. An afternoon of showing each other what comes next.",
    facts: [
      "Monday, September 28, 2026  ·  1:00 – 6:00 PM",
      "Geekdom, 3rd Floor",
    ],
    poweredLabel: "// Powered by",
    logos: [
      { repo: "public/activations/the-creative-futures.webp", height: 40 },
      { partner: "Tech Bloc", height: 60 },
      { repo: "public/access-granted/orgs/devsa.png", height: 56 },
    ],
  },

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
