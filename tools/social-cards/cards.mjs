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
  // community-group.html's own bolt placement, which used to be typed into
  // that file. Stated here so the token has the value this template has
  // always used rather than tpr.html's.
  boltLeft: -190,
  boltTop: 330,
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
  // so; UTSA gave the room, sponsored by the Harvey E. Najim Innovation
  // District.
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
  // Learn2AI's noon hour, the week's first at The Rand. Their lockup is the
  // white cut in public/activations — see lib/sponsor-marks for why the
  // published colour version cannot sit on this ground.
  learn2ai: AT_THE_RAND(
    "learn2ai.svg",
    54,
    "Tuesday, September 29",
    "12 \u2013 1 PM",
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

/**
 * Alamo City Locksport, in two cuts.
 *
 * The autumn mark is the one they now lead with and is what the strip carries.
 * It costs something: the line-art cut sets their name under the Alamo, and
 * this one is the Alamo alone, so Locksport is the only mark of the six that
 * does not say who it is. 78 rather than the others' 64 because it is 1.41:1
 * where the rest are near-square or wide wordmarks — enough to hold its own
 * in the row without becoming the row's subject, which 104 did.
 */
const LOCKSPORT_FALL = {
  repo: "public/access-granted/orgs/locksport-fall.png",
  height: 78,
};

/**
 * The line-art cut, kept for the one card that cannot use the other: the
 * lockpicking village card's whole picture is the autumn mark, and the same
 * artwork twice on one card at two sizes reads as a mistake.
 */
const LOCKSPORT_LINE = {
  repo: "public/access-granted/orgs/locksport.png",
  height: 84,
};

/** The six organisers, in the order asked for, with Locksport's cut chosen. */
const ACCESS_ORGS = (locksport) => [
  { repo: "public/access-granted/orgs/bsides.png", height: 64 },
  { repo: "public/access-granted/orgs/defcon.png", height: 64 },
  { repo: "public/access-granted/orgs/saha.png", height: 64 },
  { repo: "public/access-granted/orgs/cyberjedis.png", height: 64 },
  locksport,
  { repo: "public/access-granted/orgs/devsa.png", height: 64 },
];

export const EVENTS = {
  ...COMMUNITY,

  /**
   * DEVSA, which is a partner rather than an activation — the one entry here
   * that is not a thing on the schedule. It carries no mark of its own in the
   * template's sense (the card stages DEVSA's logo directly, the way it does
   * the house lockup) and no logo strip, because the strip *is* the bus.
   */
  /**
   * The week itself, for the cards that are about a day rather than a talk.
   * No mark and no logo strip: the house lockup at the top is the only mark
   * a schedule poster has any business carrying.
   */
  week: {
    template: "day-lineup.html",
    // Taller than the 1080x1350 every other card is. A day of this week is
    // five rooms and sixteen sessions, and at feed height the axis gives a
    // 20-minute talk 32px — less than two lines of the type it is set in.
    // 1080x1920 buys 52px, which is the block this grid is drawn around: two
    // lines of the title plus the hour it runs.
    size: { width: 1080, height: 1920 },
    logos: [],
  },

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

  /**
   * The founder format the week borrows rather than programmes: Launch SA's
   * 1 Million Cups chapter, running its ordinary Wednesday morning inside the
   * week. So the card credits two parties and not one — see `.credits` in the
   * template, and `hosts` in render.mjs.
   */
  "1-million-cups": {
    template: "one-million-cups.html",
    // The chapter's own lockup, from the repo, at the size the title slot
    // takes. Height-led like every mark here; at 96 the stacked file draws
    // 192px wide, which sets it against the headline below rather than over
    // it.
    mark: { repo: "public/activations/1-million-cups.png", height: 96 },
    facts: [
      "Wednesday, September 30",
      "9:00 \u2013 11:00 AM",
      "Launch SA, Central Library",
    ],
    // No label: the mark is set into the hook, in the sentence that says
    // what Launch SA does here, so a second line naming the relationship
    // would be saying it twice.
    hostLabel: "",
    // In colour, like the Give-a-LOT strip carries it. The navy is quiet on
    // black but it is their mark; the white treatment this tool can apply
    // would fill the glyph's teal square solid and take the arrow inside it
    // with it.
    hosts: [{ partner: "Launch SA", height: 30 }],
    poweredLabel: "Powered by",
    // No mark: PNC Bank is in neither wall, which is exactly why the page
    // prints the name — see `poweredNames` in render.mjs and the note on
    // components/site/powered-by-line.tsx. Swap to `logos` if their artwork
    // is ever added to the CMS.
    logos: [],
    poweredNames: ["PNC Bank"],
  },

  /**
   * The week's own party, and the one event here with nothing programmed
   * inside it — no speakers, no running order, no partner brand. What it has
   * instead is a room and two hours, so the card leads on the field of bolts
   * the schedule grid already runs through this row and nowhere else.
   */
  "startup-bash": {
    template: "startup-bash.html",
    facts: [
      "Thursday, October 1",
      "6:00 \u2013 8:00 PM",
      "Get on the list \u00b7 sasw.co",
    ],
    poweredLabel: "Sponsored by",
    logos: [{ partner: "Active Capital", height: 46 }],
  },

  /**
   * The Rand's standalone hours, on the TPR template.
   *
   * A talk at The Rand that belongs to a community group rides
   * community-group.html and leads with that group's mark. This is for the
   * ones that belong to nobody but the week: no mark to lead with, a speaker
   * and an hour, which is exactly the shape the stage template already draws.
   * What it needed was for "Main Stage" to stop being typed into the markup —
   * see `stage` in render.mjs.
   */
  /**
   * Women Founders Network's hour at the Central Library, on the same shape
   * `rand` uses: this stage's template with the room swapped out.
   *
   * `stage` carries the host rather than the room. The ramp caption reads
   * circuit then stage, and for a session whose whole draw is which group is
   * convening it, "Women Founders Network" is the more useful of the two \u2014
   * the library is in the facts a few lines down.
   */
  "women-founders-network": {
    template: "tpr.html",
    stage: "Women Founders Network",
    facts: ["Friday, October 2  \u00b7  9 \u2013 10 AM", "Central Library"],
    logos: [],
  },

  rand: {
    template: "tpr.html",
    stage: "The Rand",
    facts: [
      "Thursday, October 1",
      "12 \u2013 1 PM  \u00b7  The Rand, 3rd Floor",
    ],
    logos: [],
  },

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
    // 1:10, not the 1:30 this said when the slot was first set — the CMS
    // moved it and the talk page, the grid and the .ics all followed. A card
    // is the one surface that does not read the CMS for its time.
    facts: ["Monday, September 28  ·  1:10 PM", "Geekdom, 3rd Floor"],
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
    logos: ACCESS_ORGS(LOCKSPORT_FALL),
  },
};

/**
 * The Model's poster, shared by the still and the motion card so the two
 * cannot drift — every word, fact and logo is written once. The motion card
 * differs only in its art: a captured sequence of the node graph walking
 * itself on, rather than the still of where it ends.
 */
const MODEL_POSTER = {
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
  // 110, down from 130. The poster is a set with the speaker cards, which
  // run their talk titles at 66–76 beside a portrait, and at 130 the panel
  // alone — a solid lavender slab — outweighed anything else in the carousel
  // and made the swipe to a speaker card a drop rather than a step. 110
  // still reads as the event's name, and sits by the lineup slide's 104.
  headlineSize: 110,
  // One sentence a line, broken by hand. Left to wrap at this size it
  // split "An / afternoon", which reads as a setup and a stray word rather
  // than as the two halves of the hook in lib/the-model.ts.
  subtitle:
    "Creatives, founders and builders in the same room.<br />An afternoon of showing each other what comes next.",
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
};

/**
 * Thursday, as a festival lineup.
 *
 * Drawn from the day the site draws: `dayCalendar("2026-10-01")` plus the
 * talks `allTalks()` hangs off each activation, which together are what
 * /schedule/day/2026-10-01 renders. Restated here rather than read, like
 * every other fact on every other card — this is a .mjs tool and the schedule
 * is TypeScript behind a Next build. When a session moves, it moves here too.
 *
 * 300 Main is not a column. Its only Thursday booking is the brunch, which
 * finishes half an hour before the axis opens, so a column for it would be an
 * empty band captioned with a room that had already closed; the brunch is on
 * the rail with its room named. The other five rooms all have something
 * inside the window.
 *
 * Titles are shortened, which is the one liberty this format takes with the
 * schedule. A lineup block is 168px wide and ACL fills it with a name — the
 * week's equivalent is a talk's subject, not its full registered title, and
 * "Reinventing Security Operations, Intelligence, and GRC for the AI Era" set
 * at a size that fits would be unreadable at the size anybody sees this.
 * Every one still says the thing the talk is about.
 */
const THURSDAY = {
  // Noon to eight. The day runs 7:30 to 8, but three of its four morning
  // hours hold one brunch between them — see `rail`.
  axis: { from: "12:00", to: "20:00" },
  gridHeight: 1250,
  railLabel: "// Before noon",
  rail: [
    {
      title: "The Creative Futures Brunch",
      room: "300 Main",
      from: "7:30",
      to: "11:30",
      circuit: "AI & Applied Innovation",
    },
    {
      title: "The Founder\u2019s Guide to AI",
      room: "TPR",
      from: "11:00",
      to: "11:30",
      circuit: "Tech & Builders",
    },
    {
      title: "Don\u2019t Be the Next Tea",
      room: "TPR",
      from: "11:40",
      to: "12:00",
      circuit: "Founder",
    },
  ],
  rooms: [
    {
      short: "TPR",
      note: "Texas Public Radio",
      sets: [
        {
          title: "A Year of AI Coaching",
          from: "12:05",
          to: "12:25",
          circuit: "AI & Applied Innovation",
        },
        {
          title: "Securing Things vs. Securing People",
          from: "12:30",
          to: "12:50",
          circuit: "Founder",
        },
        {
          title: "Security Ops for the AI Era",
          from: "13:00",
          to: "13:20",
          circuit: "AI & Applied Innovation",
        },
        {
          title: "The New 80/20 of Coding With AI",
          from: "13:30",
          to: "13:50",
          circuit: "AI & Applied Innovation",
        },
        {
          title: "Texas Venture Fest",
          from: "15:00",
          to: "18:00",
          circuit: "Founder",
        },
      ],
    },
    {
      short: "The Rand",
      note: "3rd Floor",
      sets: [
        {
          title: "Maybe That\u2019s Not the Problem",
          who: "Rachel Davis",
          // The hook, because without it this is the one block on the grid
          // whose title says nothing about what happens in the room. It is an
          // hour of taking a problem apart with LEGO, and that is the reason
          // somebody picks it over the four other rooms at noon.
          hook: "Look sideways. Pull it apart. Rebuild what you know \u2014 with LEGO\u00ae.",
          from: "12:00",
          to: "13:00",
          circuit: "Tech & Builders",
        },
        {
          title: "Datanauts",
          from: "13:00",
          to: "14:00",
          circuit: "Tech & Builders",
          // An activation's hour is really its talks, and a block that names
          // only the group cannot say so. Times and titles from the sessions
          // hung off `activation: "datanauts"` in the CMS.
          bill: [
            {
              at: "1:00",
              title: "Move Fast, Break Data",
              who: "Ednalyn \u201cDd\u201d De Dios",
            },
            {
              at: "1:30",
              title: "Scaling Executive Vision",
              who: "Fouzan Aslam",
            },
          ],
        },
        {
          title: "AWS User Group",
          from: "14:00",
          to: "15:00",
          circuit: "Tech & Builders",
          bill: [
            {
              at: "2:00",
              title: "The Autonomous Hacker",
              who: "Daniel Morales Yusty",
            },
          ],
        },
        {
          title: "Linux San Antonio",
          from: "15:00",
          to: "17:00",
          circuit: "Tech & Builders",
          // Two hours and no bill — the group runs the room rather than
          // programming it — so the block has room for their mark, and it is
          // the one block on the grid that gains from carrying a logo rather
          // than another line of type.
          logo: "public/activations/linux-satx.webp",
        },
        {
          title: "Open Circuit",
          from: "17:00",
          to: "18:00",
          circuit: "Social",
        },
      ],
    },
    {
      short: "Central Library",
      note: "Launch SA",
      sets: [
        {
          title: "VentureLab IGNITE",
          from: "9:00",
          to: "16:00",
          circuit: "Founder",
        },
      ],
    },
    {
      short: "Centre Club",
      note: "9th Floor",
      sets: [
        {
          title: "Speed Networking",
          from: "12:00",
          to: "14:00",
          circuit: "Capital",
        },
      ],
    },
    {
      short: "Legacy Park",
      note: "Outdoors",
      sets: [
        {
          title: "Startup Bash",
          from: "18:00",
          to: "20:00",
          circuit: "Social",
          // The field the Bash card is built on, inside its own block. The
          // party is the one thing on this grid that is not a room with
          // chairs in it, and on a poster of eighteen rectangles that has to
          // be visible before it is read.
          bolts: true,
        },
      ],
    },
  ],
  weekLabel: "// All week",
  allWeek: [
    {
      title: "Give-a-LOT",
      note: "Central Library \u00b7 Computer donation drive \u00b7 Sept 28 \u2013 Oct 2",
      circuit: "Tech & Builders",
    },
  ],
};

/** What both sizes of the Thursday poster say above the grid. */
const THURSDAY_HEAD = {
  event: "week",
  eyebrow: "Day Four",
  headline: "Thursday, October 1",
  subtitle: "Six rooms \u00b7 Sixteen sessions \u00b7 Downtown San Antonio",
  note: "All times subject to change \u00b7 sastw.com/schedule",
};

/**
 * Mike Bell, in colour and in mono.
 *
 * Two cards off one set of values rather than two cards to keep in step: the
 * mono cut differs by one flag, and a second copy of the hook is a second
 * thing to remember to edit.
 */
const MIKE_BELL = {
  event: "access-granted",
  speaker: "mike-bell",
  event: "access-granted",
  speaker: "mike-bell",
  // The title whole, at 76 rather than the set's 118. "BUG BOUNTY HUNTING"
  // is 18 characters and draws 666px there; at 118 it runs past the
  // measure and past the figure with it.
  headline: "AI-powered<br />Bug Bounty Hunting",
  headlineSize: 76,
  // His own sentence, minus the "how to". The tools are the news and the
  // last clause is the reason anyone turns up.
  subtitle:
    "Find real vulnerabilities and write the reports that get you paid \u2014 with Claude, Codex and Deepseek.",
  /**
   * Not a headshot: a three-quarter figure in a beanie and leather coat,
   * holding a sword. The probe wants 1360 to draw his head the size this
   * stage draws everyone else's, which is taller than the card \u2014 his head
   * is 20.9% of his frame where the rest of this set runs 33\u201344%.
   *
   * So the pose carries it rather than the face, the way `edwin-jung` does
   * on PySanAntonio. 940 is the ceiling: his crown lands at 477 and the
   * headline\u2019s second line runs to x=738 at y 380\u2013440, so any taller and
   * his hood climbs into "BUG BOUNTY HUNTING". Left 447 lands his ink on
   * the card\u2019s right edge \u2014 solved off his ink (188\u2013897 of his 1080)
   * rather than his frame, which carries 188px of empty alpha on one side
   * and 183 on the other.
   *
   * Re-solved when his picture changed: the new cut is hooded and sits
   * lower, crown 97px into the frame against 42.
   */
  portrait: { height: 940, left: 447 },
};

/** A day on the main stage. See `randDay` for the same thing at The Rand. */
const tprDay = (iso, weekday, date) => ({
  event: "tpr",
  template: "venue-day.html",
  venueDay: { venue: "tpr", day: iso },
  // The date without the weekday — the headline already says it.
  dayLabel: date,
  headline: `${weekday} at TPR`,
  headlineSize: 104,
  // tpr.html's own placement for a card with no figure: right and down,
  // bleeding off the right edge and the bottom.
  boltLeft: 40,
  boltTop: 250,
  // Pinned when the colon rule moved from 44 characters to 60: at 59 this
  // would now print whole and wrap, on a card that was approved with it cut.
  titles: {
    "the-truth-about-startups-what-are-you-going-to-do-about-it":
      "The Truth About Startups",
  },
  // The wordmark the site sets in this title everywhere it draws it. See
  // TITLE_MARKS in components/site/calendar/marks.tsx — same file.
  titleMarks: {
    "building-nopalera-on-her-own-terms": {
      repo: "public/brand/nopalera-wordmark.png",
      word: "Nopalera",
    },
  },
});

/** TPR's three looks for one day: faint bolt, bolt field, the building. */
const tprDayCards = (iso, weekday, date) => {
  const base = tprDay(iso, weekday, date);
  return [
    { id: `venue-day-tpr-${iso}`, ...base },
    // The Startup Bash field in place of the one big bolt.
    { id: `venue-day-tpr-${iso}-bolts`, ...base, boltField: true },
    // The room's own portrait — the magenta ASCII of the building the site
    // draws in its venue section (`image` on TPR in lib/locations.ts).
    {
      id: `venue-day-tpr-${iso}-building`,
      ...base,
      venueArt: {
        url: "https://firebasestorage.googleapis.com/v0/b/sasw2026-783a5.firebasestorage.app/o/sasw-assets%2Fsastw-tpr-magenta.png?alt=media",
        // Tall enough, and lifted enough, that the tower sign ends above the
        // band's foot: the image draws 720 tall at full width, and 18% of the
        // 120 it overflows puts the "O" of RADIO at y≈540 of 600.
        height: 600,
        position: "50% 18%",
        gap: 290,
      },
    },
  ];
};

/**
 * A day at The Rand — Geekdom's third floor, where the community groups DEVSA
 * hosts all year each take an hour, and the three activations with brands of
 * their own take an afternoon. Each row is a block and the talks inside it;
 * see `venueDay` in render.mjs.
 */
const randDay = (iso, weekday, date) => ({
  event: "rand",
  template: "venue-day.html",
  venueDay: { venue: "the-rand", day: iso },
  // Not the ramp: its five pips say every circuit lands in this room, which
  // is TPR's claim as the main stage, not The Rand's.
  ramp: false,
  stage: "Geekdom, 3rd Floor",
  dayLabel: date,
  headline: `${weekday} at The Rand`,
  headlineSize: 96,
  // The `rand` event's facts are one Thursday session's; this is the room.
  facts: ["The Rand", "110 E Houston St"],
  boltLeft: 40,
  boltTop: 250,
  titles: {
    // A sentence rather than a title, with no colon to cut at. The LEGO is
    // the hook, so it stays.
    "maybe-thats-not-the-problem":
      "Maybe That\u2019s Not the Problem \u2014 with LEGO\u00ae",
    // The parenthetical is the subtitle; the site's cards split it the same.
    "i-spy-with-my-kernel-eye-what-your-box-is-doing-before-you-ever-log-in":
      "I Spy With My Kernel Eye",
  },
});

/** The Rand's three looks for one day: faint bolt, bolt field, building. */
const randDayCards = (iso, weekday, date) => {
  const base = randDay(iso, weekday, date);
  return [
    { id: `venue-day-the-rand-${iso}`, ...base },
    { id: `venue-day-the-rand-${iso}-bolts`, ...base, boltField: true },
    // The Rand's own portrait from lib/locations.ts — the Geekdom "g" over
    // the building. Near-square, so it stands on the right rather than
    // spanning the top the way TPR's does, and the headline takes two lines.
    {
      id: `venue-day-the-rand-${iso}-building`,
      ...base,
      headline: `${weekday} at<br />The Rand`,
      venueArt: {
        url: "https://firebasestorage.googleapis.com/v0/b/sasw2026-783a5.firebasestorage.app/o/sasw-assets%2Fglogo-rand.jpg?alt=media",
        side: "right",
        width: 540,
        height: 557,
        gap: 110,
      },
    },
  ];
};

/**
 * A day at Central Library — Launch SA's floor inside the library, where the
 * week's small-business programme runs. Launch SA's own sessions arrive as CMS
 * talks (with their Eventbrite links), 1 Million Cups, VentureLab IGNITE and
 * Give-a-LOT as curated blocks; the card lists both, as the day page does.
 */
const libraryDay = (iso, weekday, date) => ({
  // Any event serves for defaults the card overrides; this one is already a
  // Central Library event.
  event: "women-founders-network",
  template: "venue-day.html",
  venueDay: { venue: "central-library", day: iso },
  // Not the ramp: its five pips are TPR's claim as the main stage.
  ramp: false,
  stage: "Launch SA, 1st Floor",
  dayLabel: date,
  headline: `${weekday} at Central Library`,
  headlineSize: 96,
  facts: ["Central Library", "600 Soledad St"],
  boltLeft: 40,
  boltTop: 250,
  titles: {
    // The half before the colon is the vague half here; the event is the
    // launch it names after it.
    "one-vision-one-alliance-the-bdo-alliance-san-antonio-launch-celebration":
      "BDO Alliance-San Antonio Launch & Celebration",
  },
});

/** Central Library's three looks for one day: faint bolt, bolt field, building. */
const libraryDayCards = (iso, weekday, date) => {
  const base = libraryDay(iso, weekday, date);
  return [
    { id: `venue-day-central-library-${iso}`, ...base },
    { id: `venue-day-central-library-${iso}-bolts`, ...base, boltField: true },
    // Launch SA's portrait from lib/locations.ts — their mark over the
    // library. Near-square (819x720), so it stands on the right like The
    // Rand's, and the headline takes two lines beside it.
    {
      id: `venue-day-central-library-${iso}-building`,
      ...base,
      // The host rather than the building on this one: the art is Launch SA's
      // own mark, so the headline names who the art already shows. Two lines,
      // like The Rand's, and short enough to clear it.
      headline: `${weekday} at<br />Launch SA`,
      venueArt: {
        url: "https://firebasestorage.googleapis.com/v0/b/sasw2026-783a5.firebasestorage.app/o/sasw-assets%2Fsastw-launchsa.jpg?alt=media",
        side: "right",
        width: 500,
        height: 440,
        // Below the lockup and dates, so the blue Launch SA mark at the top of
        // the portrait is not under them or their shade.
        top: 130,
        gap: 110,
      },
    },
  ];
};

export const CARDS = [
  {
    ...THURSDAY_HEAD,
    id: "lineup-thursday",
    lineup: THURSDAY,
  },

  /**
   * The same day at feed height.
   *
   * 1080x1350 is where these get posted; the tall one is what you print, put
   * in a story, or hand somebody at a badge desk. Same eight hours in 350
   * fewer pixels, so a 20-minute talk gets 38 of them instead of 52, and
   * `compact` spends the difference where it shows: the morning becomes one
   * wrapped line instead of three aligned rows, every size drops about a
   * quarter, and a block under 46px stops printing its own hour — its place
   * against the ruled hours already says when it is, and a title clipped in
   * half says nothing at all.
   *
   * Not a crop of the tall one, and not a second layout either: one set of
   * sessions, one stylesheet, a dozen numbers that differ.
   */
  {
    ...THURSDAY_HEAD,
    id: "lineup-thursday-feed",
    size: { width: 1080, height: 1350 },
    // 790, not the tall card's 1250, and solved rather than guessed: the
    // chrome above and below the grid measures 554px at compact sizes, and
    // 1350 minus that is what the axis gets. A shorter lane heading (44
    // against 58) pays for 14 of it.
    lineup: {
      ...THURSDAY,
      gridHeight: 790,
      headHeight: 44,
      compact: true,
    },
  },

  // ─── PySanAntonio ─────────────────────────────────────────────────────────
  {
    id: "pysanantonio-speaker-jay-jahns",
    event: "pysanantonio",
    speaker: "jay-jahns",
    /**
     * The loop's three steps, with the third one replaced.
     *
     * Red-Green-Refactor is the phrase every TDD practitioner in that room
     * has in their head, and the talk's own opening is that AI "can
     * hallucinate a flawless passing test for a feature that doesn't
     * actually work". Breaking the cycle on its last word is the abstract's
     * argument in three words. Set whole it draws 943px against the 936
     * measure, so it breaks after the comma rather than stepping down a size.
     */
    headline: "Red, Green,<br />Hallucinate",
    // The registered title, hyphens and all — the card leads with a hook, so
    // the line under it is what the schedule calls the talk.
    subtitle: "Python, Test-Driven-Development, and AI",
    portrait: { height: 903, left: 439 },
  },
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
    // Daniel first, at the organisers' request — the order the pair is
    // credited in, left to right.
    speakers: ["daniel-gallegos", "serena-hernandez"],
    headline:
      'What happens when<br /><span class="hit">creative storytelling</span><br />collides with<br />startup strategy?',
    // Swapped with the speakers, so each crop keeps its own solved numbers.
    // Solved against Daniel: both heads ~284px, crowns 14px under the frame.
    // Serena's 740 is by eye, not the probe's 651 — her hair hides the
    // shoulder line the probe watches for, so it read her head as longer
    // than it draws and came out ~15% short.
    portraits: [
      { height: 622, top: -46 },
      { height: 740, top: -28 },
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

  /**
   * AlamoCityAI's hour inside The Model: three presenters, then a panel with
   * all three. One session in the CMS (`alamo-city-ai`), so one card with
   * three columns — the pair template's `trio`.
   *
   * Joe, Matthew, Derek: the exhibit first, then the VFX shot, then the
   * game — reordered from the overview's sequence to lead with Joe. The three crops are framed alike, so one height and a top solved
   * off each crown (Joe 104, Derek 73, Matthew 100 of 1350) line the heads up:
   * top ≈ 20 − crown × 590 / 1350.
   */
  {
    id: "the-model-speakers-alamo-city-ai",
    event: "the-model",
    trio: true,
    speakers: ["joe-guerra", "matthew-bell", "derek-alexander"],
    headline: "Big Work, <span class=\"hit\">Small Teams</span>",
    subtitle:
      'Studio-level film, games and interactive work, in the hands of one person. Hosted by <span class="host">AlamoCityAI</span>.',
    // In `speakers` order: Joe, Matthew, Derek.
    portraits: [
      { height: 590, top: -26 },
      { height: 590, top: -24 },
      { height: 590, top: -12 },
    ],
  },

  {
    id: "the-model-speakers-rose-chavez",
    event: "the-model",
    // One card for a two-speaker talk, as hernandez-gallegos is: the talk is
    // theirs jointly and either can post it.
    speakers: ["aj-rose", "diego-chavez"],
    // The title to its colon and its subject, and the description's own
    // example underneath it.
    //
    // It ran the whole submitted title first, which fit in four lines and
    // said where the talk applies — "for High-Traffic Physical Spaces" — but
    // not what anyone will see in it. The description has that: a live
    // convention booth turning attendees into printed vinyl-toy figures in
    // under ninety seconds, with no cloud in the loop. That is the hook, and
    // it lands on the card's own title — "Beyond the Cloud" — without
    // restating it. The panel stays on "Offline AI Pipelines", the subject.
    headline:
      'Beyond the Cloud: Building<br /><span class="hit">Offline AI Pipelines</span>',
    // The description's own example, as a sentence rather than a spec line.
    //
    // It has three candidates and this is the only concrete one. The opening —
    // "Cloud APIs promise simplicity, but live event floors demand zero
    // latency" — is the talk's argument, but it is abstract under a headline
    // that is already abstract, and would say "Beyond the Cloud" twice. The
    // close, Las Vegas and Denver trade shows, is credibility rather than a
    // reason to stop scrolling. The booth is the thing a reader can picture.
    //
    // A first pass ran "Attendee photos to printed vinyl-toy figures in under
    // 90 seconds — 100% local, zero internet": a fragment, and it dropped
    // "big-head", which is the word that makes the image. "No internet" goes
    // too — the headline has already said offline.
    //
    // Broken by hand at two lines; left to wrap, a hook this long orphans its
    // last word and pushes the names below where the sibling card sets them.
    subtitle:
      "A convention photo booth that turns attendees into<br />big-head vinyl toys, printed in under 90 seconds.",
    // Solved against the fade, not the probe.
    //
    // The template darkens the bottom 42% of each 408px frame — load-bearing,
    // since without it the crop ends each figure on a hard line — so a chin
    // has to land above 237px or the face goes dim. The probe's pair drew
    // their heads small; scaled up by a fifth "to match" the sibling card,
    // they drew ~295px crown to chin against Daniel's ~205, a head and a half
    // bigger, with AJ's beard and Diego's jaw inside the fade.
    //
    // So both are solved from measured crown and chin, as fractions of each
    // frame: head ~215px (level with hernandez-gallegos), chin at ~225px (just
    // above the fade), crown ~10px under the edge.
    portraits: [
      { height: 646, top: -76 },
      { height: 592, top: -43 },
    ],
  },

  {
    id: "the-model-speaker-cynthia-gentry",
    // Same shape as leon-hitchens and jonathan-perry: The Model's facts, the
    // single-speaker template, a talk inside the afternoon.
    event: "the-model",
    template: "the-model.html",
    speaker: "cynthia-gentry",
    eyebrow: "// The Model \u00b7 AI & Applied Innovation",
    /**
     * The submitted title, whole, with the panel on "Directing".
     *
     * Not on "Prompt", which is the obvious noun and the wrong one: the talk
     * argues the prompt is the least interesting part of the work, and the
     * lavender on it would mark the half she is arguing against — the same
     * trap maria-consuelo-gonima's note describes for "not just the product".
     * Directing is what the talk is about.
     *
     * Two lines, at 72. It ran three at 76, and the third line pushed the
     * hook below it down into her hair: her crop is tight, 50px from crown to
     * frame, so she reaches higher on the card than anyone else in the set
     * and the copy above her has less room to spend.
     */
    headline:
      'Beyond the Prompt:<br /><span class="hit">Directing</span> in the Age of AI',
    headlineSize: 72,
    // Her description's opening line, verbatim. It is the hook the talk wrote
    // for itself, and it pays off the headline without restating it.
    subtitle:
      "The prompt might be the least interesting part of making a film with AI.",
    // Sized against leon-hitchens and jonathan-perry rather than the probe's
    // 740, which drew her head a sixth smaller than theirs. 820, a shade under
    // their ~331px head, because her crown sits so near the top of her own
    // frame: at 862 her hair rose into the end of the hook, and the 40px
    // taken off comes out of where her crown lands rather than out of her
    // face.
    portrait: { height: 820, left: 439 },
  },

  {
    id: "the-model-speaker-leon-hitchens",
    // Same shape as jonathan-perry and maria-consuelo-gonima: The Model's own
    // facts, single-speaker template, a talk inside the afternoon rather than
    // a fixed point in it.
    event: "the-model",
    template: "the-model.html",
    speaker: "leon-hitchens",
    // The circuit joins the eyebrow because this template has no slot of its
    // own for one — and it is the only place on the card where a second fact
    // about where the talk sits does not compete with the talk itself.
    eyebrow: "// The Model \u00b7 AI & Applied Innovation",
    /**
     * His line, not ours.
     *
     * The submitted title is "Putting Grok Bot and Agents to Work in a Real
     * Business", which is what the talk is called and not what it argues.
     * Set as the headline it is a long compound with no claim in it, and the
     * lavender panel — the event's signature, and the reason these headlines
     * are written to have one — would have had to land on "Grok Bot", a
     * product name.
     *
     * His own bio says the work is "figuring out where AI actually earns its
     * keep inside an agency". That is the thesis, in his words, and it puts
     * the panel on the claim the way jonathan-perry's puts it on the machines.
     * The submitted title runs underneath, whole.
     */
    headline: 'Where AI actually<br /><span class="hit">earns its keep</span>',
    headlineSize: 76,
    // Title case, and left alone. This is the talk's name as the CMS holds it,
    // and a name keeps its case — the sibling cards set sentence case because
    // their subtitles are descriptions rather than titles.
    // Broken by hand rather than by measure. Left to wrap it reads "...in a
    // Real / Business." at every width that fits the card — the title's two
    // halves are 35 and 19 characters, so the only measures that break them
    // cleanly are ones that leave the first line visibly short. The tag takes
    // HTML, so the break is stated.
    subtitle: "Putting Grok Bot and Agents to Work<br />in a Real Business.",
    // 880, matching jonathan-perry, rather than the probe's 756.
    //
    // The probe says so itself: the crown is exact and the height is a guess
    // that hair confuses. At 756 his head drew 284px against Jonathan's ~330
    // on the card beside it, and two speakers at the same event with heads a
    // sixth apart read as two different templates. His head is 37.6% of his
    // own frame, so 880 draws it at 331 — level with the card this one will
    // be posted next to, which is the comparison that matters.
    portrait: { height: 880, left: 439 },
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
    // The CMS has Maria Consuelo Gonima chairing it. Credited under the hook,
    // by name only: this is his keynote, and she has a card of her own for her
    // own talk.
    moderator: "maria-consuelo-gonima",
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
    id: "aitx-ai-and-startups",
    event: "aitx",
    speakers: ["brenda-gentry", "jesus-rafael-burgoa", "joseph-delong"],
    headline: "AI and Startups",
    headlineSize: 96,
    // Named work, then the turn. Their own summary \u2014 "what works, what
    // doesn't work, and how founders can start small" \u2014 is the shape of an
    // answer without any of it; the three areas they list are the specific
    // part, and "just adds steps" is the half nobody else on the week is
    // saying out loud.
    subtitle:
      "Research, product, operations \u2014 where AI actually saves a small team time, and where it just adds steps.",
    /**
     * Near-equal figure heights, with `bottom` levelling the crowns.
     *
     * The probe measures head *height* and Brenda has a lot of hair, so
     * matching on it put her at 917 against Joseph's 660 \u2014 and her head
     * silhouette then drew 425px against his 174. Measured three ways: her
     * face is 184 against his 169, barely wider, while her hair makes the
     * whole head two and a half times his. The probe was sizing her hair.
     *
     * So heights sit together (701/660/690) the way the Denim Group card's
     * three do, and her hair reads as hair rather than as a scaling error.
     * Her face ends up the smallest of the three at 137; that is what a
     * person with that much hair looks like beside two who have none.
     *
     * `bottom` levels the crowns on 724, since three different crops start at
     * three different depths. Negative numbers cost nothing here \u2014 this row
     * bleeds off the card's foot, so pushing a figure down crops it rather
     * than leaving the gap a positive lift does.
     *
     * `top` is distance from the right edge, solved off their face centres
     * (582, 546, 375 of their own frames) to put those centres 250px apart,
     * then the whole row moved 110px right. That was worth it twice over:
     * Brenda was cut 88px by the left edge, and the row now sits further off
     * the copy the scrim has to hold it clear of. Jesus takes 62px of crop on
     * the outer shoulder in exchange.
     */
    portraits: [
      { height: 690, top: 416, bottom: -40 },
      { height: 701, top: 140, bottom: -13 },
      { height: 660, top: -91 },
    ],
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

  /**
   * The YouTube Short. 1080x1920, and a bill rather than a running order.
   *
   * PySanAntonio's Short reveals seven talks a line at a time over its own
   * footage. Datanauts has two talks and no footage — so this shows the group,
   * then each talk with the face giving it, then the ask. Six states, each
   * replacing the last, encoded straight from its own stills.
   *
   * The template it uses is written for all six community groups, not for
   * this one: same reason `community-group.html` serves them all. Only the
   * card changes.
   */
  {
    id: "datanauts-short",
    event: "datanauts",
    template: "community-group-short.html",
    size: { width: 1080, height: 1920 },
    // 1, as the other moving cards use: a video is transcoded by every
    // platform it touches and the extra sample rate buys nothing.
    scale: 1,
    // 92, against the still card's 62. The mark is the only thing on here
    // that says which of the six groups this is, and it has to carry that at
    // feed size through every one of the six states.
    markHeight: 92,
    speakers: ["ednalyn-dd-de-dios", "fouzan-aslam"],
    /**
     * Matched at the crown, not at the file.
     *
     * Her crop is head-and-shoulders and his is looser — her head is 46% of
     * her own frame against his 21% — so no single height draws the two faces
     * the same size, which is the conclusion the 4:5 cards reached and the
     * ratio between their heights (900 : 881) is carried over here. What is
     * matched instead is where the crown lands, at y=1000 for both: that is
     * the number a viewer compares across two beats of the same video, and a
     * face that jumps 25px between cuts is the one thing this format makes
     * impossible to miss.
     *
     * 1000 is also what the copy above is sized against — the block holds 560
     * and ends by 878, clear of the hair.
     *
     * 1350 is the headshots' own height, so they draw one source pixel to one
     * frame pixel. Anything larger is an upscale of a CMS photo and anything
     * smaller throws away resolution these already have; at 1150 the faces
     * were a sixth smaller for no reason but an earlier guess.
     */
    portraits: [
      { height: 1350, top: 887 },
      { height: 1322, top: 915 },
    ],
    kicker: "Two talks, one hour",
    subtitle:
      "San Antonio\u2019s data and AI community, on the Tech & Builders circuit.",
    talks: [
      {
        title: "Move Fast,<br />Break Data",
        subtitle: "A Situationship With the Truth",
      },
      {
        title: "Scaling<br />Executive Vision",
        subtitle:
          "Automated C-Suite Insights with the Data Intelligence Hub Deck Generator",
      },
    ],
    ctaLine: "Free with your badge.",
    ctaUrl: "sasw.co/schedule/datanauts",
    /**
     * Six states at one bar each, with two on the ask.
     *
     * 3.000s is a bar at 80 BPM, which is the grid the PySanAntonio Short
     * settled on — kept here so the two read as a series and so a track at
     * that tempo drops straight in. There is no music on this one yet; the
     * timing is the only thing that has to be decided before there is.
     *
     * 21 seconds for two talks, against 30 for seven. A bill has less to say
     * and holding it longer would not make it say more.
     */
    reveal: [3, 3, 3, 3, 3, 6],
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
  /**
   * Access Granted as a YouTube Short.
   *
   * The afternoon is five community groups with an hour each \u2014 a list, and
   * a list revealed a beat at a time is what this format does that a still
   * card cannot. The feed card has to lead on one thing; here every group
   * gets its own moment.
   *
   * Holds: 3s on the name and hook, 2s per block, 4s on the outro. Five
   * blocks makes 17 seconds of card, which sits under the supplied padlock
   * clip's 10 and inside the minute a Short gets.
   */
  {
    id: "access-granted-short",
    event: "access-granted",
    template: "access-granted-short.html",
    size: { width: 1080, height: 1920 },
    // 1, like the other moving cards: a video is transcoded by every platform
    // it touches and the extra sample rate buys nothing.
    scale: 1,
    subtitle:
      "Every other room this week is people talking about technology. This one is people taking it apart.",
    kicker: "Six talks, one afternoon",
    /**
     * Speakers and their talks, not the five community blocks.
     *
     * The blocks are how the day is *organised* — who owns which hour — and
     * that is the right frame on the event page, where a reader is deciding
     * which community to spend an afternoon with. It is the wrong frame here.
     * Nobody scrolling past stops for "DEF CON Group SA, two talks"; they
     * stop for a name and a title they want to hear. The credits survive on
     * the page and on every speaker card.
     *
     * Titles verbatim from the CMS, including the malware's real name — it is
     * the talk's name, and softening it on the card and not on the page would
     * leave the two disagreeing.
     *
     * The village is last and flagged rather than timed: it runs all five
     * hours, so a start time would file it as a seventh thing to be late for.
     */
    rows: [
      {
        at: "1:10",
        who: "Richard Davey",
        what: "Trust Each Other, Not Technology",
      },
      {
        at: "1:50",
        who: "Jacob Wellnitz",
        what: "The Hackers Left. Now What?",
      },
      {
        at: "2:15",
        who: "Dante Moreno",
        what: "Meow-ware: A Look at the Gayfemboy Malware",
      },
      { at: "2:50", who: "Keeban Villarreal", what: "How to Prepare for Q-Day" },
      {
        at: "3:50",
        who: "Corey Hartman",
        what: "Glyph: A binary analysis tool powered by machine learning",
      },
      { at: "4:50", who: "Mike Bell", what: "AI-powered Bug Bounty Hunting" },
      {
        // The hours in the time column rather than "all day", which it is
        // not, or "all afternoon", which does not fit it. The green name and
        // the tint behind the row are what say this one has no start time.
        at: "1 \u2013 6 PM",
        who: "Lockpicking Village",
        what: "Alamo City Locksport \u00b7 drop in, no experience needed",
        flag: "open",
      },
    ],
    ctaLine: "Wed, Sept 30 \u00b7 1 \u2013 6 PM \u00b7 Geekdom, 3rd Floor",
    ctaUrl: "sasw.co/schedule/access-granted",
    /**
     * One hold per step, plus the outro.
     *
     * The first is longer because a viewer arrives mid-scroll and needs a beat
     * to read the name; the village gets an extra second because it is the one
     * row that changes the offer — everything above it is a thing you turn up
     * on time for, and that is the thing you cannot be late for.
     */
    reveal: [3, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 2.6, 4],
  },

  /**
   * The second Access Granted Short: the afternoon a face at a time.
   *
   * The first Short is the running order as a list. This one gives each
   * speaker a frame — hour, title, name, the group whose hour it is — and
   * then the village, then the outro. Nothing about the talks is typed here:
   * `lineupOf` reads them off the CMS in running order, with the group each
   * falls under from `accessBlockFor`, the same credit the event page prints.
   *
   * Composited behind the padlock clip the same way the first Short is, so
   * the two open alike.
   */
  {
    id: "access-granted-short-speakers",
    event: "access-granted",
    template: "access-granted-speakers.html",
    size: { width: 1080, height: 1920 },
    scale: 1,
    lineupOf: "access-granted",
    subtitle:
      "Every other room this week is people talking about technology. This one is people taking it apart.",
    kicker: "Six speakers \u00b7 Wed, Sept 30",
    /**
     * Only the exceptions; everyone else takes the default 1240, about 1.35x
     * their feed cards' 918, because here the figure has the whole width and
     * the bottom two-thirds to stand in.
     *
     * Corey's is an illustration rather than a headshot, with 146px of empty
     * alpha under it — his feed card pushes that off the edge with a negative
     * `bottom`, and so does this, scaled — and its mass sits left of its own
     * box, so it is nudged right to stand where the others do. Mike's is full
     * length, so it runs a little shorter to keep his head where theirs are.
     */
    portraits: {
      "corey-hartman-ph-d": { height: 940, bottom: -102, shift: 100 },
      "mike-bell": { height: 1200 },
    },
    village: {
      logo: "public/access-granted/orgs/locksport-fall.png",
      when: "1 \u2013 6 PM \u00b7 all afternoon",
      title: "Lockpicking Village",
      line: "Pick locks in the open. All ages welcome, no experience needed.",
      by: "Alamo City Locksport",
    },
    ctaLine: "Wed, Sept 30 \u00b7 1 \u2013 6 PM \u00b7 Geekdom, 3rd Floor",
    ctaUrl: "sasw.co/schedule/access-granted",
    // Opener, six speakers, the village, the outro.
    reveal: [2.8, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.8, 4],
  },

  {
    id: "access-granted-event",
    event: "access-granted",
    art: "public/access-granted/padlock.png",
    /**
     * The event's own name as the title, where a speaker card puts the talk's.
     *
     * There is no talk here, so the wordmark that stands over one on every
     * other card on this template has nothing above it and takes the size
     * instead — 118, the headline’s. No `headline`, which the template now
     * guards: a card that titled itself "TAKING IT APART." under a 92px
     * "ACCESS GRANTED" was two display lines arguing about which was the
     * name of the thing.
     */
    wordmarkSize: 118,
    // One row, like the village card and for the same reason: the lock is
    // lifted clear of the foot, so the strip has the whole 936px measure
    // rather than the ~410 a standing figure leaves it.
    logoCols: 6,
    // Wider than the default, and the scrim over it weakened to match.
    // The schematic is what fills the black beside the lock; the scrim is
    // what was painting it out. See `.portrait::after`.
    gridMask: "96% 70% at 52% 50%",
    // 0.1, not the default 0.055. Under this template’s scrim a 0.055
    // line peaks at 13/255 on the left against 20 where the field is
    // unscrimmed — a difference a meter reads and an eye does not.
    gridInk: 0.1,
    scrimLeft:
      "rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 26%, rgba(0, 0, 0, 0) 52%",
    /**
     * Their one-liner whole, rather than split across the two slots.
     *
     * It was a headline and a subtitle — the punch hoisted above its own
     * setup, which reads backwards once you notice. With the name taking the
     * title the sentence runs in the order it was written, and the turn
     * lands where a turn should.
     */
    subtitle:
      "Every other room this week is people talking about technology. This one is people taking it apart.",
    // Two lines, with the hours leading the second rather than trailing the
    // first. Whole on one line the day and the hours draw 620px and the last
    // third sits on the padlock; on three lines the hours are a fact of their
    // own, which they are not — they belong to the day above them. This is
    // the split the village card uses, and it stops at 492.
    facts: ["Wednesday, September 30", "1 – 6 PM  ·  Geekdom, 3rd Floor"],
    // 800, down from 980. The lock is the card’s picture rather than its
    // subject — at the old size its shackle reached the hook and its body
    // crossed under the facts. Moved right as it shrank so it stays anchored
    // to the card’s edge rather than drifting into the middle.
    //
    // Lifted off the bottom too. This slot anchors to the card’s foot
    // because it was drawn for a standing figure, and a figure is cropped
    // there on purpose; shrinking a lock inside it just slid the lock down
    // and opened 140px of black above the shackle. At 235 it centres in the
    // column the copy leaves it and clears the single-row strip below: the
    // marks run to x=750 and the lock’s body starts at 512.
    portrait: { height: 800, left: 512, bottom: 235 },
  },

  /**
   * The event card, moving.
   *
   * Same card as `access-granted-event` — same wordmark, hook, facts and
   * powered-by strip — with the padlock render swapped for the footage it was
   * made from. Not a replacement: a still is what goes in a post that will be
   * screenshotted, printed or mailed, and this is what goes in a feed.
   *
   * The two carry the lock at the same size in the same place on purpose, the
   * way the PySA pair do. `portrait: { height: 800, left: 512, bottom: 235 }`
   * puts the still’s padlock across x512–1030, y315–1115; `height`, `x` and
   * `y` below put the clip’s lock across x506–1024, y315–1115. Anyone seeing
   * both sees one card that happens to move.
   *
   * The clip’s ground is what makes this composite work at all, and it was
   * measured rather than hoped for: every corner of the source frame reads
   * rgb(1,1,1) against this template’s pure black, so the rectangle where the
   * footage ends is invisible. The grid is drawn *over* the clip and carries
   * across that edge; the bloom is dropped, because a green radial that stops
   * where the footage stops is the one thing that would reveal it. See
   * `if:transparent` in the template.
   */
  {
    id: "access-granted-event-motion",
    event: "access-granted",
    /**
     * Prepared, not the raw file, and it lives here rather than in `public/`.
     *
     * The supplied render is 1280x720 landscape with the lock in the middle
     * third and a lot of black either side — placed whole it would be a lock
     * six hundred pixels wide in a card that wants it five hundred tall. So
     * the asset is cropped and scaled once, with lanczos, to the size the
     * card draws it at, and the one resample that happens is the good one.
     *
     * The crop is x145–839 of the source and its *full* height, which is
     * wider than the lock needs and is the point. A rectangle of footage laid
     * on this card has four edges, and the clip's ground is not quite black —
     * it carries a faint dark-green schematic of its own, around 8/255 against
     * this template's 0. That is invisible at a glance and perfectly visible
     * as a straight vertical line under a black-level stretch, which is what
     * a phone in a dark room is. So the horizontal edges are put where they
     * cannot be seen: this crop, at this scale, starts at x0 and runs to 1082,
     * six pixels past the frame. Neither side has an edge inside the card.
     *
     * Top and bottom are still in frame, and the source's own first and last
     * rows are darker — about 1/255, except during the 0.3s the lock flashes
     * open, when they reach 6. So the asset ramps to black over its top and
     * bottom 44 rows before scaling. The lock has 55 rows of clearance above
     * and 107 below at its tallest, so the ramp never touches it.
     *
     * It is also closed into a loop: the source ends on a lock rotated away
     * from camera and starts on one facing front, which cuts visibly when a
     * feed wraps it. The last 0.7s dissolves into the first 0.7s instead,
     * which costs 1.5s of the ten and makes the wrap seamless.
     *
     * `tools/social-cards/assets/` rather than `public/`, unlike
     * `pysa2-loop.mp4`: that one is on the PySA page (`lib/pysa.ts`) and the
     * card borrows it. Nothing on the site plays this one, and a megabyte and
     * a half shipped to the CDN for a page that never asks for it is a cost
     * with no reader. If the Access Granted band ever wants a moving lock,
     * this moves to `public/` and both use it.
     */
    video: {
      src: "tools/social-cards/assets/padlock-loop.mp4",
      // The asset is already 1082x1122, so this is the size it was baked at
      // and the renderer's own `scale` is a no-op.
      height: 1122,
      x: 0,
      y: 159,
      // One play. The file is a loop, so the feed's own wrap is the loop —
      // playing it twice inside the file would only make a longer video that
      // wraps in exactly the same place.
      loops: 0,
      seconds: 8.54,
    },
    // Everything below is `access-granted-event`, unchanged. The two cards
    // are the same card.
    wordmarkSize: 118,
    logoCols: 6,
    gridMask: "96% 70% at 52% 50%",
    gridInk: 0.1,
    scrimLeft:
      "rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 26%, rgba(0, 0, 0, 0) 52%",
    subtitle:
      "Every other room this week is people talking about technology. This one is people taking it apart.",
    facts: ["Wednesday, September 30", "1 \u2013 6 PM  \u00b7  Geekdom, 3rd Floor"],
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

  /**
   * The quiz night, in PySanAntonio's own blue and gold.
   *
   * No Jeopardy! logo on it, deliberately. That mark belongs to Jeopardy
   * Productions / Sony Pictures — jeopardy.com brands itself "America's
   * Favorite Quiz Show®" — and putting it on a card for an unaffiliated event
   * that is giving prizes away is the exact use a trademark exists to stop:
   * it reads as a licence nobody granted.
   *
   * Nothing is lost by leaving it off, because the format is not the mark.
   * The headline is the format — a category and a dollar value is the game in
   * six words — and this template already paints in #4a90d9 and #edca00,
   * which is a quiz board's palette and happens to be PySanAntonio's own. The
   * card reads as the thing without borrowing anyone's logo, and it reads as
   * PySanAntonio rather than as a knock-off of a game show.
   */
  {
    id: "pysanantonio-jeopardy",
    event: "pysanantonio",
    art: "public/pysa/mascot-block.webp",
    // See `pysanantonio-event` — the same block, matted the same way.
    artBlock: true,
    // The category-and-value line is the whole format, and it is funnier than
    // naming the game. "Python for 400" is a clue nobody has to explain.
    headline: "We\u2019ll take<br />Python for 400.",
    headlineSize: 96,
    subtitle:
      "A quiz night for the Python crowd \u2014 no prep, no teams to join in advance, and a pair of PyTexas tickets on the board.",
    // No hour: the session has a day and a room and not yet a slot inside the
    // afternoon. Stating one would be inventing it. Add `facts` here when the
    // running order lands, the way every other card on this stage does.
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

  /**
   * The YouTube Short. 1080x1920, and the one card in here that is a list.
   *
   * Everything else PySanAntonio posts is a poster — a hook, a face, a fact
   * row. A Short is watched, not read at a glance, and what it has that a
   * poster does not is twenty seconds of someone's attention. The right thing
   * to spend that on is the running order, arriving a line at a time, which
   * is also the one thing a still cannot do.
   *
   * Titles are cut to what survives at arm's length on a phone. "From Sensor
   * to Signal: Building an Indoor Air Quality Platform With Python" is 74
   * characters and wraps to three lines at this size; the half before the
   * colon is the half that reads, and the full title is one tap away.
   *
   * Times drop their meridiem. Every session here is in the afternoon and the
   * fact line above already says 1 - 6 PM, so seven repetitions of "PM" buy
   * nothing and cost the width the speakers' names want.
   */
  {
    id: "pysanantonio-short",
    event: "pysanantonio",
    template: "pysanantonio-short.html",
    size: { width: 1080, height: 1920 },
    // 1, for the reason `pysanantonio-motion` gives: a video is transcoded by
    // every platform it touches and the extra sample rate buys nothing.
    scale: 1,
    facts: ["Friday, October 2  \u00b7  1 \u2013 6 PM", "Geekdom, 3rd Floor"],
    kicker: "The running order",
    rows: [
      {
        at: "1:10",
        who: "Mason Egger",
        what: "Opening keynote \u00b7 PyTexas Foundation",
      },
      { at: "1:45", who: "Samad Ahmed", what: "From Sensor to Signal" },
      {
        at: "2:40",
        who: "Jordana Naftali",
        what: "JOMO in the age of AI slop",
      },
      { at: "3:15", who: "Edwin Jung", what: "Experiments in Agentic Coding" },
      {
        at: "4:00",
        who: "Yossi Eliaz",
        what: "Your agent\u2019s requirements.txt is a lie",
      },
      { at: "4:10", who: "Shayan Ali", what: "AI Steering Wheel" },
      {
        at: "4:30",
        who: "Python Jeopardy",
        what: "Two tickets to PyTexas 2027 on the board",
        prize: true,
      },
    ],
    ctaLine: "Free with your badge.",
    ctaUrl: "sasw.co/schedule/pysanantonio",
    /**
     * Nine states: the header, then one per row, then the call to action.
     *
     * One bar each, and the bar is the track's. "Sabor a la Antigua" is 80
     * BPM in 4/4 — 3.000s to the bar, which is as clean as this ever gets —
     * so every speaker's name arrives on a downbeat and the call to action
     * takes the last two bars. Ten bars, thirty seconds, no drift.
     *
     * Cut silent this ran 1.9s a row, which is the floor for reading a name
     * and a title at this size. A bar is longer than it needs to be for
     * reading and exactly right for hearing, and with music under it the
     * extra second does not read as a pause.
     *
     * If the track changes, this changes with it: hold = 4 x 60 / BPM, and
     * `video.loops` has to cover the new total — `-t` trims the footage, so
     * the only failure mode is too little of it.
     */
    reveal: [3, 3, 3, 3, 3, 3, 3, 3, 6],
    /**
     * The figure, bottom-anchored and centred-ish.
     *
     * Solved the same way `pysanantonio-motion`'s numbers were — against the
     * card — but with one constraint that composition did not have: the clip
     * is landscape and its subject sits right of its centre (x 420-992 of
     * 1114), so centring *him* pushes the footage left and exposes the right
     * edge of a 1080 frame. Covering the width and holding him near the
     * middle needs the clip at ~1315 wide, which is what sets `height` at
     * 850 rather than anything about how big he should be.
     *
     * `y` puts his feet past the bottom edge rather than resting on it: he is
     * cropped at the hip in the source, so a figure that stops inside the
     * frame reads as a cutout that ran out rather than as someone standing
     * in it.
     */
    video: {
      src: "public/pysa/pysa2-loop.mp4",
      height: 850,
      x: -234,
      y: 1108,
      // 4, for five plays and 35.6s, against a 30s cut. Was 3 when this ran
      // 21.4s; a loop count short of the reveal total ends the card early.
      loops: 4,
    },
    /**
     * From YouTube's Audio Library, and deliberately not in this repo.
     *
     * Those tracks are licensed to the uploader for use in their videos, not
     * for redistribution — and a public repo is redistribution. So the file
     * stays where it was downloaded and this points at it; a render without
     * it warns and comes out silent rather than failing.
     *
     * `start` is a downbeat, not a round number. The track opens on a 30s
     * build that peaks at -20 dBFS, and a Short whose first second is the
     * quietest thing in it has thrown away the only second that matters.
     * 31.830 is the first downbeat of the full section, where the level
     * steps up to -8.5 and stays.
     *
     * No fade in worth the name: the cut lands on a downbeat, and fading up
     * over it would soften the one frame that should hit. 0.12s is a
     * de-click, not an effect. The tail fades over two beats so the track
     * resolves under the call to action instead of being cut off mid-bar.
     */
    audio: {
      src: "~/Downloads/Sabor a la Antigua - Cumbia Deli.mp3",
      start: 31.83,
      fadeIn: 0.12,
      fadeOut: 1.5,
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
    // actually about rather than a restatement of its title. It was ours
    // ("Three technologies, one patent question.") until Alamo Inventors sent
    // their own; theirs is the one the page draws, so it is the one the card
    // draws.
    subtitle: "Valuable Insights for AI Innovators!",
  },

  /**
   * The one card on this stage with no speaker on it.
   *
   * Texas Venture Fest is an event at Texas Public Radio rather than a talk
   * given there, and none of its people — two co-hosts and an MC — are in the
   * CMS, so there is no headshot to resolve and no name for the block above
   * the facts. What goes in the figure slot instead is the event's own
   * lockup, through `art`, the same way Access Granted uses its padlock and
   * The Model its key art.
   *
   * It stays on this template rather than moving to `panel.html`, which is
   * where the Cyber, AI & Robotics panel went for the same reason. The
   * difference is the room: that panel is in a popup venue and this is on the
   * main stage, and the five-charge ramp is the thing that says so. A card
   * for this stage without it would be a card that could be anywhere.
   *
   * Greyscaled like every portrait here, and it costs one colour: the tan
   * "10/1/26" baked into their artwork. That is the template's own argument
   * rather than an oversight — the bolt runs at 0.62 on this card precisely
   * because it is the only colour on it, and a second one in the figure half
   * is the thing greyscale exists to prevent. The boot is grey and the
   * wordmark white already, so the date is all that changes.
   */
  {
    id: "texas-venture-fest",
    event: "tpr",
    art: "public/activations/texas-venture-fest.png",
    // Their lockup carries "TEXAS VENTURE FEST" in the figure half, so the
    // headline saying it again would be the card's two largest things
    // agreeing with each other. It takes the promise instead — their own
    // framing, the half that is not in the name.
    headline: "The Deals<br />That Don\u2019t Make<br />Headlines",
    headlineSize: 92,
    subtitle: "And an honest look at where the ecosystem still has work to do.",
    // Founder, as on the activation — this is firesides and panels about the
    // people building here, not a room where capital is deployed.
    circuit: "Founder",
    // Overrides the event's venue-and-street pair. That default exists
    // because the speakers on this stage sit across different days and the
    // day cannot come from the event; this card is one event with one slot,
    // so it states it, and the room rides along on the second line.
    facts: ["Thursday, October 1", "3 \u2013 6 PM  \u00b7  Texas Public Radio"],
    // Landscape where every other figure here is a person: 1.39:1 against a
    // portrait's 0.7, so the height that draws a head draws a lockup 776px
    // wide and 216px of it falls off the card. Height here is chosen from the
    // width instead — 375 draws 519, which clears the right edge by 41px.
    //
    // `bottom` exists for this card. Every portrait on this stage sits at 0
    // and bleeds off the frame, which is what a crop of a person should do; a
    // lockup flush on the edge reads as artwork that did not fit. 210 also
    // keeps it clear of the facts, which run to x=500 along the bottom, and
    // off the bolt, whose mass ends around x=490.
    portrait: { height: 375, left: 520, bottom: 210 },
  },

  /**
   * Five founders who got through H-E-B's Quest for Texas Best, so the card
   * takes the template's panel row rather than its pair layout — same bare
   * cutouts, bottom-anchored and overlapping, at the size five can hold.
   *
   * Sponsored, which is the other thing five speakers bring: the strip at the
   * foot carries H-E-B, whose contest the whole session is about. That is the
   * one case where a logo on this stage is not decoration — see the note on
   * `.powered` in tpr.html.
   */
  /**
   * The ETA panel: five people, the second card on this stage to take the
   * template's panel row.
   *
   * Headline off the description's own opening rather than the session name.
   * "Buy, Build, Lead" is the format; "most founder stories start with an
   * idea — this one starts with a business someone else already built" is the
   * argument, and the half of it that makes somebody stop is the second.
   */
  {
    id: "tpr-buy-build-lead",
    event: "tpr",
    speakers: [
      "matthew-reedy",
      "patrick-mays",
      "ron-ondechek-jr",
      "dan-geddes",
      "carlos-guevara",
    ],
    /**
     * Solved rather than eyeballed, the same way quest-to-shelf is.
     *
     * `height` equalises the heads: these five crops run 31% to 38% head
     * width, so identical heights would draw five different-sized people.
     * `top` is distance from the right edge, set from where each face
     * actually lands in its own frame so the five face centres come out
     * 195px apart — a cutout is three times wider than the face in it, so
     * evenly spaced figures put a shoulder across the next one's face.
     */
    portraits: [
      { height: 490, top: -46 },
      { height: 614, top: 107 },
      { height: 601, top: 311 },
      { height: 564, top: 509 },
      { height: 518, top: 724 },
    ],
    /**
     * The session's own name, at the team's request, split at its colon the
     * way every other card on this stage splits one.
     *
     * What it replaces was a hook rather than a title: "Skip the Idea. Buy
     * the Business." was written off the description's opening, and it did
     * the job a card headline does — told a reader what the hour is for in
     * five words. The title is the format, which is the thing the team needs
     * on the graphic.
     *
     * The cost is the fact. The subtitle carried "thousands of profitable San
     * Antonio businesses need new operators this decade", which is the line
     * that made somebody stop, and there is nowhere left for it: this
     * template has a headline, a subtitle and the five names, and the title
     * now takes two of the three. It belongs in the caption instead, where it
     * has room to be a sentence rather than a fragment.
     *
     * 106, not 92: one line of sixteen characters draws 826px of the card's
     * 936, where the two-line version needed the smaller size to fit.
     */
    headline: "Buy, Build, Lead",
    headlineSize: 106,
    subtitle: "An Introduction to Entrepreneurship Through Acquisition",
    // Capital, as the site files it: this is about financing and deal flow.
    circuit: "Capital",
  },

  {
    id: "tpr-speaker-dan-hoverman",
    event: "tpr",
    speaker: "dan-hoverman",
    // Broken after "to", not at a colon \u2014 the title has no colon and the
    // name is the whole hook. "Y\u2019ALL STREET" draws 643px at 110, well
    // inside the measure, so it gets the size a two-word headline can carry.
    headline: "Welcome to<br />Y\u2019all Street",
    headlineSize: 110,
    /**
     * The abstract\u2019s own turn, which is sharper than its news.
     *
     * It opens on headlines \u2014 TXSE ringing its first bell, Nasdaq Texas
     * launching at the Alamo, IPOs in 2027 \u2014 and then says the real
     * question is quieter. A card that lists the milestones is a card about
     * Texas; this one is about the founder reading it.
     */
    subtitle:
      "The headlines are everywhere. The quieter question is what any of it means for a pre-seed founder here.",
    circuit: "Capital",
    /**
     * Shortened from the CMS\u2019s "Managing Director, Head of Corporate &
     * Investment Banking", which is 56 characters where this slot holds 33.
     * Set whole it ran from x=74 to x=845 and his jacket starts at 556 \u2014
     * 289px of magenta type over a lapel.
     *
     * The title rather than the division, because the line under it says
     * Texas Capital Bank and a managing director at that bank talking about
     * Texas capital markets needs no further explaining. The full title is on
     * his speaker page.
     */
    role: "Managing Director",
    // 780, not the probe's 645. The probe sizes a head to match the rest of
    // this stage, which is right for a card where the figure is a portrait
    // beside copy; this one wanted the figure to hold the right side, and at
    // 645 his ink stopped at x=867 with 210px of black beside it. His cutout
    // reaches his frame's right edge, so filling the card is a matter of
    // scale and offset. Solved off his drawn silhouette rather than his
    // bounding box \u2014 his ink only reaches the frame edge at the rows the
    // card crops away \u2014 so 780 at left 520 puts his shoulder on 1079.
    portrait: { height: 780, left: 520 },
  },

  {
    id: "tpr-behind-the-build",
    event: "tpr",
    speakers: ["sheridan-chambers", "dan-cornell", "john-dickson"],
    circuit: "Tech & Builders",
    // The title, split at its own colon. Both halves earn their line: the
    // first is what the hour is, the second is whose story it is, and
    // neither works alone on a card for people who may not know the firm.
    headline: "Behind the Build:<br />The Denim Group Story",
    headlineSize: 76,
    // Their own closing line, and the reason this is on the main stage
    // rather than in a security room: the deal is the hook, staying is the
    // point.
    subtitle:
      "Three founders who built it here, sold it here, and are still here.",
    // No facts of its own, so it takes the venue and street every other card
    // on this stage shows. The slot is known — Tuesday, 11:00 — and left off
    // deliberately: a day plus a 45-minute range runs that line out to the
    // width of the headline above it, and this block is meant to sit quietly
    // under three faces.
    /**
     * Three crops solved to draw three heads the same size, then spaced off
     * where the faces actually are.
     *
     * Their head-to-frame ratios run 38.5% (Dan), 42.6% (John) and 44.7%
     * (Sheridan), so equal heads need heights that differ by as much —
     * 740/859/777 against Sheridan as the reference.
     *
     * `top` is distance from the right edge, and it is solved rather than
     * evenly spaced: a cutout is three times wider than the face in it, so
     * even gaps between *figures* put one man's shoulder across the next
     * one's face. Measured off the alpha channel, their face centres sit at
     * 534, 515 and 546 of their own 1080 frames, and these numbers put those
     * centres 280px apart on the card.
     */
    portraits: [
      { height: 740, top: 501 },
      { height: 859, top: 161 },
      { height: 777, top: -67 },
    ],
  },

  {
    id: "tpr-quest-to-shelf",
    event: "tpr",
    speakers: [
      "renato-raposo",
      "charlie-edwards",
      "rocio-leon",
      "leticia-de-leon",
      "maria-flores",
    ],
    // `height` is each figure's height; `top` is its distance from the right
    // edge. Heights are solved off the probe so five different crops draw
    // five heads the same size; the 168px spacing is what lets them overlap
    // like a group without a face landing on a face.
    // Heights solved off the probe so five different crops draw five heads
    // the same size — their head-to-frame ratios run 30% to 38%, so the
    // numbers have to differ by that much to look equal. `top` is distance
    // from the right edge; 150px apart is what overlaps them like a group
    // without a face landing on a face.
    // `top` is solved from where each face actually lands, not from an even
    // gap between figures: a cutout is three times wider than the face in it,
    // so evenly spaced *figures* put one person's shoulder across the next
    // one's face — Rocio covered 125px of Leticia's. Measured off the alpha
    // channel and re-spaced to put the five face centres 195px apart, then
    // the row shifted 48px right as a block: at the spacing that cleared
    // Leticia, the last face sat 8px off the left edge.
    portraits: [
      { height: 560, top: -40 },
      { height: 536, top: 170 },
      { height: 624, top: 324 },
      { height: 512, top: 574 },
      { height: 606, top: 716 },
    ],
    // The promise, not the session name — "Quest to Shelf" says the contest,
    // this says what the half hour is: five people who actually got there.
    headline: "Garage to<br />Grocery Aisle",
    headlineSize: 96,
    // Non-breaking hyphens in the brand: left alone it wrapped as "H-E-/B\u2019s"
    // and split the name across two lines.
    subtitle:
      "Five Texas founders who came out of H\u2011E\u2011B\u2019s Quest for Texas Best with real distribution \u2014 and what it took to get on the shelf.",
    circuit: "Founder",
    poweredLabel: "Sponsored by",
    // H-E-B first: the session is about their contest. Nopalera is the
    // Founder circuit's sponsor, which is the circuit this runs on. 44
    // against H-E-B's 58 because theirs is a round badge and this is a 4.6:1
    // wordmark — matched by drawn weight rather than by height.
    logos: [
      { partner: "H-E-B Supplier Diversity", height: 58 },
      { partner: "Nopalera", height: 44 },
    ],
  },

  {
    id: "tpr-state-of-cpg",
    event: "tpr",
    speakers: ["andrew-m-anguiano", "charles-woodin"],
    circuit: "Capital",
    // The title, broken at its preposition. Whole it is 30 characters and
    // wraps on its own under the ramp.
    headline: "The State of CPG<br />in San Antonio",
    headlineSize: 92,
    // The abstract's own closing triplet, which does what the paragraph above
    // it takes four sentences to do. "One of the country's most influential
    // grocers is headquartered here" was the other candidate and it is the
    // better fact, but it names H-E-B without naming them and reads as a
    // riddle on a card.
    subtitle:
      "What the shelves want. What SA is shipping. What\u2019s next for CPG in Texas.",
    /**
     * Solved at the crown, as every pair on this template is, and then
     * against the copy \u2014 which is the part that made this one work.
     *
     * Their crops are different shapes, not just different depths: Andrew\u2019s
     * frame is 1080x1350 where Charles\u2019s is 750x938, so the same height
     * draws two different figures. 644 and 660 land their crowns at y=743 and
     * y=737.
     *
     * The pair card beside this one sits its figures at left 270 and works,
     * because Maria\u2019s cutout carries transparent margin. These two are ink
     * to the frame border, so the same numbers painted over the names and cut
     * "ANDREW M. ANGUIANO" in half. The copy was measured instead of guessed
     * \u2014 render the card with the portraits at 180 and the column shows \u2014
     * and its longest line ends at x=455.
     *
     * `top` is distance from the right edge. Andrew sits as far left as his
     * own silhouette allows: at the name rows his shoulder is the widest part
     * of him, and at 160 it clears "CHARLES WOODIN" by about 30px. Charles
     * takes the crop on the right instead, which costs an outer shoulder
     * nobody reads.
     */
    portraits: [
      { height: 644, top: 160 },
      { height: 660, top: -130 },
    ],
  },

  {
    id: "tpr-the-long-haul",
    event: "tpr",
    speakers: ["josh-sanchez", "alberto-pina"],
    // Cat Dizon chairs it \u2014 the description says so, and the card says so in
    // a line rather than a third face. Her CMS record still has her down as a
    // speaker on this session.
    moderator: "cat-dizon",
    circuit: "Founder",
    // The title\u2019s first half. Whole it is 51 characters; the second half is
    // what the hook is for, and "The Long Haul" is the part that works as a
    // name for the hour.
    headline: "The Long Haul",
    headlineSize: 118,
    // The title\u2019s other half, then the description\u2019s own framing. "Not the
    // launch story. The middle." is the sentence that says why this is a
    // different panel from every other founder hour on the week.
    subtitle:
      "Building in San Antonio past Series\u00a0A. Not the launch story \u2014 the middle.",
    /**
     * Level crowns, and Josh in front so his bigger head is the near one.
     *
     * His crop is much tighter than Alberto's — 41.9% of frame against
     * 33.4% — so the two cannot both have equal heads and level crowns.
     * Equal heads puts him at 590 against 740 and drops his crown 134px.
     *
     * `bottom` was the fix on the pre-seed card and it does not work here.
     * Shrinking him and lifting him back leaves black under him at the
     * card's foot, and this template bleeds its figures off the bottom, so
     * the edge of that gap reads as a straight cut across his suit — checked
     * at 134px and again at 39px, visible both times. So: 730 against 740,
     * crowns level on 654, no gap, and his head draws about 24% larger than
     * Alberto's. On the figure standing behind that is the wrong way round,
     * Josh leads, so that reads as depth rather than as an error — which is
     * what it was when he stood behind.
     *
     * `top` is distance from the right edge, solved off their face centres
     * (532 and 543 of their own 1080) to put those centres 230px apart, with
     * Alberto\u2019s ink clearing the name column at x=375.
     */
    // 50px below this template's default, to get the bolt's tip out of the
    // moderator line. At 430 the point reaches y=501 and the line sets at
    // 508-518, so a magenta wedge 16px wide ran straight through "BY".
    boltTop: 480,
    poweredLabel: "Sponsored by",
    // Active Capital, whose co-founder chairs the hour. Same partner lookup
    // the startup bash card uses.
    logos: [{ partner: "Active Capital", height: 46 }],
    portraits: [
      { height: 730, top: 136 },
      { height: 740, top: -104 },
    ],
  },

  {
    id: "tpr-pre-seed-age-of-ai",
    event: "tpr",
    speakers: [
      "kelsey-waters",
      "brian-sierakowski",
      "ray-cantu",
      "franklin-morris",
    ],
    // Name only, no face \u2014 the treatment the-model.html uses and the one
    // tpr.html gained for this card. The person chairing is not one of the
    // people the card is about, and a thumbnail beside the credit reads as a
    // speaker at a smaller size.
    moderator: "jasper-sundeen",
    circuit: "Founder",
    headline: "Pre-seed in the<br />Age of AI",
    headlineSize: 92,
    // The abstract's own test, which is the useful half. "The tools have
    // changed" is the setup and every founder reading this already knows it;
    // what they have not been told is whether it is working.
    subtitle:
      "What AI is actually doing inside their companies. Where it\u2019s earning its keep \u2014 and where it isn\u2019t.",
    /**
     * One height for all four rather than four solved for equal heads.
     *
     * Equal heads is the rule for portraits at one distance; it is the wrong
     * rule for a bottom-anchored row, where a shorter figure sits with its
     * crown lower and reads as standing further back. The CPG pitch card
     * learned this the expensive way.
     *
     * It also sidesteps a bad measurement: the probe puts Franklin's head at
     * 57.1% of his frame against 36.1% for Brian, which would make him barely
     * two thirds their height. That is the chin detection failing, which the
     * probe's own note warns about \u2014 not a real difference of that size.
     *
     * `top` is distance from the right edge, solved off their face centres
     * (546, 541, 542, 554 of their own 1080) to put those centres 200px
     * apart, then the row anchored so the last figure's ink lands on the
     * card's edge — off the drawn silhouette rather than the bounding box,
     * because these cutouts are widest above the rows a shoulder actually
     * occupies and a bbox solve left a 60px gap. Re-solved when Ray and
     * Franklin swapped: their silhouettes differ on that side, so the gap
     * came back and the whole row moved 60px right again.
     */
    portraits: [
      { height: 660, top: 439 },
      { height: 660, top: 237 },
      { height: 660, top: 43 },
      { height: 580, top: -131, bottom: 74 },
    ],
  },

  {
    id: "tpr-sa-cpg-pitch-social",
    event: "tpr",
    /**
     * Four founders now, not the two this card shipped with \u2014 so it takes
     * the crowd row rather than the pair layout, and the names move to a
     * credits line under the hook.
     *
     * The headline is the description\u2019s own promise rather than the session
     * name. "SA CPG Pitch & Social" says the format; "San Antonio\u2019s next
     * shelf staples" says what is being pitched, which is the part a reader
     * scrolling past has any reason to care about.
     */
    speakers: ["maria-flores", "chris-cook", "kellee-everts", "daniel-mezza"],
    /**
     * Kellee and Daniel match Chris\u2019s 644 rather than the 552 and 518 that
     * would draw their heads the size of his.
     *
     * Equal heads was the first solve \u2014 their head-to-frame ratios run 31.0%
     * (Maria) to 41.9% (Daniel), so equal heads needs a 35% spread in figure
     * height \u2014 and it is right for a row of portraits at one distance. It is
     * wrong here: these are bottom-anchored, so a shorter figure sits with
     * its crown lower, and the row read as two founders standing behind the
     * other two rather than beside them. Matching the figures levels the row;
     * the cost is that Kellee\u2019s and Daniel\u2019s heads draw about 17% and 24%
     * larger than Chris\u2019s, because their crops are tighter.
     *
     * `top` is distance from the right edge, solved from where each face
     * actually sits in its own frame \u2014 their centres are 553, 564, 555 and
     * 548 of their own 1080 \u2014 to put those centres 215px apart on the card.
     * Re-solved after the heights changed: the scale moves the face with it,
     * so the old offsets would have bunched the last two.
     *
     * Then the whole row moved 147px right, which is what it took to land
     * Daniel on the card\u2019s edge. His frame already ran 4px past it \u2014 the
     * measurement that matters is his ink, and his cutout carries enough
     * transparent margin on that side that the row was stopping at x=933.
     * Shifting the set rather than him alone keeps the 215px between faces.
     * Spacing the *figures* evenly instead puts one person\u2019s shoulder across
     * the next one\u2019s face, which is the note quest-to-shelf carries.
     */
    portraits: [
      { height: 700, top: 475 },
      { height: 644, top: 287 },
      { height: 644, top: 68 },
      { height: 644, top: -151 },
    ],
    headline: "San Antonio\u2019s Next<br />Shelf Staples",
    headlineSize: 92,
    // The hosts are pictured now, so the copy stops naming them — the card
    // says it twice otherwise, once in type and once in their faces.
    subtitle:
      "Founders pitch their products live. Happy hour follows \u2014 drinks, samples, and the room behind SA\u2019s consumer goods scene.",
    // Founder. The CMS carries no track on this session, so this is the
    // card's own call — a pitch night for consumer product founders is that
    // circuit if it is any of the five. Worth confirming with the organisers.
    circuit: "Founder",
    // The same pair quest-to-shelf carries, and in the same order: H-E-B for
    // the CPG programme these pitches feed, Nopalera as the Founder circuit's
    // sponsor. Heights matched by drawn weight — a round badge against a
    // 4.6:1 wordmark.
    poweredLabel: "Sponsored by",
    logos: [
      { partner: "H-E-B Supplier Diversity", height: 58 },
      { partner: "Nopalera", height: 44 },
    ],
  },

  {
    id: "tpr-speaker-oscar-perez",
    event: "tpr",
    speaker: "oscar-perez",
    // Split at the colon, as patrick-robinson and samad-ahmed are. The first
    // half is the journey and the second is what he did with it; whole, it is
    // 74 characters and three lines under the ramp.
    headline: "From Factory Floor<br />to SaaS",
    headlineSize: 92,
    subtitle: "Building Software to Solve Your Own Problem",
    // Founder, and it is the talk's own circuit on the site. He is a
    // manufacturer who built the tool his own floor needed — the room this
    // belongs in is the one about starting things, not the one about models.
    circuit: "Founder",
    // 980, against the probe's 852. His crop is the loosest on this stage —
    // head 33% of its frame where Patrick's is 46% — so the probe's height
    // drew his face about 15% smaller than the card he posts beside. Sized to
    // match that one instead; his crown sits 165px into the frame, the
    // deepest here, which is why the number has to be this much larger.
    portrait: { height: 980, left: 439 },
  },

  {
    id: "tpr-speaker-janie-martinez-gonzalez",
    event: "tpr",
    speaker: "janie-martinez-gonzalez",
    /**
     * Split at the colon, like patrick-robinson and oscar-perez. Whole, the
     * title is 50 characters and wraps to three lines under the ramp; and the
     * half before the colon is the better half anyway — "The Readiness Gap"
     * is the idea, "AI, Quantum, and What Comes Next" only says which
     * technologies it is about.
     *
     * The talk's own sharper line is "Are we innovating faster than we are
     * preparing?", and it was the other candidate for the headline. It lost
     * because it is a question a reader answers in their head and scrolls
     * past; the gap is a thing they want named. The question belongs in the
     * caption, where a reply is the point.
     */
    headline: "The Readiness Gap",
    headlineSize: 96,
    subtitle: "AI, Quantum, and What Comes Next",
    // The talk's own circuit on the site, and the one she keynotes for.
    circuit: "AI & Applied Innovation",
    /**
     * 1030, against the probe's 959, and this one is capped rather than
     * matched.
     *
     * Hers is the loosest crop on this stage — her head is 29.6% of its frame
     * where Oscar's is 33% and Patrick's 46% — so it takes the tallest figure
     * here to draw a face the size of theirs, and long hair puts the
     * suggestion further the wrong way: it delays the shoulder line the probe
     * watches for, so the head measures longer than it draws and the height
     * comes back short.
     *
     * Her face still lands about a tenth smaller than Oscar's, and it stays
     * there, because the headline is the ceiling. The figure is anchored at
     * the bottom, so every pixel of height lifts the crown; at 1100 her hair
     * reaches the P of GAP and the last letter of the headline sits in it.
     * A tenth of a face is a smaller cost than a headline with hair through
     * it, and the hair mass reads as head anyway.
     */
    portrait: { height: 1030, left: 439 },
    /**
     * No sponsor strip, though Webhead sponsors the circuit she is speaking
     * on — because Webhead is hers. A "sponsored by" line under her own name
     * reads as her buying the slot rather than as a company backing a room,
     * which is the opposite of what the sponsorship is. The circuit credit
     * lives on the talk page, where the whole circuit is in view.
     */
  },

  {
    id: "1-million-cups",
    event: "1-million-cups",
    kicker: "Small Business \u0026 Solopreneur",
    /**
     * The blurb's second half, which is the format itself — three verbs in
     * the order a founder meets them. The first half says what it is and
     * where it runs, and that is the line under it.
     */
    headline: "Present.<br />Take questions.<br />Leave with answers.",
    headlineSize: 92,
    // Split where their mark goes — see `quoteTail` in render.mjs for why
    // the sentence is in two pieces. Nothing follows the mark now: "run by"
    // ends on it, so the credit is the last thing read rather than a word
    // trailing after the logo.
    quote: "The weekly founder format, run by",
    quoteTail: "",
    // Central Library's own illustration, the URL lib/locations.ts builds
    // through ASSET() for this room — written out because this file is plain
    // JS and that helper is TS.
    art: "https://firebasestorage.googleapis.com/v0/b/sasw2026-783a5.firebasestorage.app/o/sasw-assets%2Fsastw-launchsa.jpg?alt=media",
  },

  {
    id: "startup-bash",
    event: "startup-bash",
    // The page's own eyebrow, in its own order. The venue is not repeated in
    // the facts below it — the three lines there are the two a reader acts on
    // and the one that tells them how.
    kicker: "Social \u00b7 Legacy Park",
    // Two words, two lines, as large as the card will carry. Nothing else is
    // competing for the upper half.
    headline: "Startup<br />Bash",
    headlineSize: 176,
    // The blurb, split where it already has a full stop. The first sentence
    // is four words and is the whole pitch, so it is set at headline weight
    // rather than buried in body copy; the second carries the terms.
    deck: "Where the week unwinds.",
    quote: "Open-air, the whole ecosystem in one place, no badge scanning.",
    poweredLabel: "Sponsored by",
  },

  {
    /**
     * The same card with the room under it — Legacy Park's own illustration,
     * which lib/schedule.ts already gives this activation as its hero.
     */
    id: "startup-bash-park",
    event: "startup-bash",
    kicker: "Social \u00b7 Legacy Park",
    headline: "Startup<br />Bash",
    headlineSize: 176,
    deck: "Where the week unwinds.",
    quote: "Open-air, the whole ecosystem in one place, no badge scanning.",
    poweredLabel: "Sponsored by",
    // The URL lib/schedule.ts builds through ASSET() for this activation's
    // hero, written out because this file is plain JS and that helper is TS.
    art: "https://firebasestorage.googleapis.com/v0/b/sasw2026-783a5.firebasestorage.app/o/sasw-assets%2Fsastw-legacypark.jpg?alt=media",
  },

  {
    /**
     * Two people, one talk — the first card on the community template to take
     * a pair rather than two cards.
     *
     * The other groups' hours are one speaker each, or two talks that each get
     * their own card. This is one live build with two people on stage, and a
     * card per person would have said the same title twice under different
     * faces. See the pair layout in community-group.html.
     */
    id: "learn2ai-build-a-startup-live",
    event: "learn2ai",
    speakers: ["mayank-gohil", "mihir-shah"],
    // One line, with the exclamation the session's own billing carries. 22
    // characters of Oswald at 80 draws 857px of the card's 936.
    headline: "Build a Startup, Live!",
    headlineSize: 80,
    /**
     * Their own framing first, then the turn.
     *
     * "This will be a live build, not a lecture" is the abstract's opening
     * and it is the promise — every other AI session on the week is somebody
     * talking about models. The second half is the part nobody else is
     * saying: the same job done again with the wifi off, by a model that
     * costs nothing to run.
     */
    subtitle:
      "A live build, not a lecture. Your idea becomes a brand in 40 minutes \u2014 then does it again offline, for free.",
    roles: ["AI Solution Architect", "Co-Founder"],
    /**
     * The event's two lines split into three, to give the figures room.
     *
     * "12 - 1 PM  \u00b7  The Rand, 3rd Floor" is one 520px line, and it — not
     * the names above it, which stop at 330 — is what decided how far left
     * the pair could stand. Broken apart the column ends at 382, and the
     * 138px that buys goes straight into their height.
     */
    facts: ["Tuesday, September 29", "12 \u2013 1 PM", "The Rand, 3rd Floor"],
    // Lower than this template's default, because the pair sits lower than a
    // single figure — see `.bolt` in community-group.html.
    boltTop: 470,
    /**
     * Two people standing beside each other, at the size the copy allows.
     *
     * The pair began the way this template's other pairs do — one figure
     * large at the edge, the second behind it — and at 680/705 Mihir was a
     * head above Mayank's shoulder and nothing else. Standing them side by
     * side is a width problem, not a position one: both cutouts are widest
     * at the very bottom, where Mayank's reaches all 1080px of his frame and
     * Mihir's 890, so the two together want about 1.03 x their height in
     * card width and every pixel of height costs a pixel of room.
     *
     * The first side-by-side pass solved that by shrinking them to 515/556,
     * which fit with nothing cropped and left them small against a card this
     * empty. Splitting the facts line above moved the copy's edge from 520
     * to 382, so they stand at 684/700 instead and their crowns reach y=724
     * and y=692 — a third of the card, the proportion the CPG pair holds.
     * The cost is 38px of Mihir's outer arm at the right edge, which is the
     * cheapest thing on the card to give up.
     *
     * Solved against each face's place in its own frame rather than by eye:
     * Mayank's head spans 333-716 of his 1080 and sits 114px below his
     * crown, Mihir's 362-666 and 81px. Those four numbers put Mayank's head
     * at 569-763 on the card and Mihir's at 793-950, 30px apart.
     *
     * Mihir is only 2% taller here rather than the 8% the smaller pair used.
     * At this size 8% threw his crown 69px clear of Mayank's, which reads as
     * a man standing on a step; matching their head sizes outright needs 26%
     * and is worse. A nearer figure with a slightly larger head is how two
     * people photographed together actually look.
     *
     * `top` is distance from the right edge, so Mihir's is negative.
     */
    portraits: [
      { height: 684, top: 133 },
      { height: 700, top: -85 },
    ],
  },

  {
    id: "wfn-speaker-laney-cloud",
    event: "women-founders-network",
    speaker: "laney-cloud",
    circuit: "Founder",
    // Her company, not the session's registered title. "Women Founders
    // Network: The Village with Laney Cloud" is 51 characters and names the
    // host, the venture and the speaker \u2014 the ramp above already says the
    // host and the block below already says her name, so the headline gets
    // the one thing neither of them covers.
    headline: "The Village",
    headlineSize: 118,
    /**
     * Her own reason for building it, which is sharper than what it is.
     *
     * "A day spa and members-only social club for women" describes the
     * business; "the infrastructure she wishes she'd had a decade ago" is why
     * a room of founders should care. The description gives both \u2014 this
     * keeps the second and enough of the first to place it.
     */
    subtitle:
      "A day spa and members-only social club for women \u2014 the infrastructure she wishes she\u2019d had a decade ago.",
    // Off the probe: her head is 37.6% of her frame, which puts her at 755 to
    // draw the head this template's figures draw. Left 504 rather than the
    // set's 439, which is where her ink lands on the card's right edge \u2014 at
    // 439 her shoulder stopped at 1007 with 73px of black beside it.
    portrait: { height: 755, left: 504 },
  },

  {
    id: "rand-speaker-rachel-davis",
    event: "rand",
    speaker: "rachel-davis",
    /**
     * Split at the full stop the title already has, which is the same cut the
     * TPR cards make at a colon. "Maybe That's Not the Problem." is the whole
     * hook — a sentence that argues with the reader — and everything after it
     * is the method.
     */
    headline: "Maybe That\u2019s Not<br />the Problem.",
    headlineSize: 92,
    subtitle:
      "Look sideways. Pull it apart. Rebuild what you think you know, with LEGO\u00ae.",
    // Tech & Builders, as the talk page files it.
    circuit: "Tech & Builders",
    /**
     * Bigger than the probe's 742, and further right: she fills the right
     * third rather than standing in it. A crop at 38.3% head-to-frame draws a
     * head the size of this stage's others at 742, which is the number the
     * probe solves for — but this card has no five-name credits line under
     * the hook and no sponsor strip at its foot, so the space the others
     * spend on those is hers.
     */
    /**
     * Whole, which is the departure on this stage.
     *
     * Every other portrait here bleeds off the right edge, because a crop of
     * a person running out of frame is what these cards do. Hers does not:
     * her cutout is 546px wide at this height and her hair carries the shape,
     * so the edge was taking the side of her head rather than a shoulder.
     * 420 puts her ink at x 534-1064 — clear of the card's edge by 16px, and
     * her head band starts at 680, well right of the hook's 545.
     */
    portrait: { height: 920, left: 420, bottom: 0 },
    /**
     * The bolt stays where tpr.html puts it, and only drops.
     *
     * At the template's 430 its tip measured x 280-332 across rows 503-551,
     * which is where the subtitle's second line sits — the one thing that
     * file says the bolt may never do. 505 clears the last line of type by
     * 25px and leaves the left-hand mass exactly where the rest of the stage
     * has it.
     */
    boltTop: 505,
  },

  {
    id: "tpr-speaker-bill-gonzalez",
    event: "tpr",
    speaker: "bill-gonzalez",
    /**
     * The title whole, which is not what the rest of this stage does — the
     * others split at the colon because their second halves are subjects
     * rather than hooks. This one is the hook: the joke is "a bit", and it
     * only lands with "quantum computing" beside it to be the other meaning.
     * Cutting to "A Bit of Quantum Truth" to buy a shorter line would have
     * spent the pun on 15 characters.
     *
     * It breaks after QUANTUM, which sets the two lines within about 80px of
     * each other — the tidiest block on this stage.
     */
    headline: "A Bit of Quantum<br />Computing Truth",
    headlineSize: 96,
    // His own three, in his own order. The talk's promise is the hype being
    // named alongside the technology, by someone building the thing.
    subtitle: "The Technology, the Hype, and the Algorithms",
    circuit: "AI & Applied Innovation",
    /**
     * 780, against the probe's 561 — the largest correction this tool has
     * needed, and the clearest case of what it warns about.
     *
     * His is the tightest crop on this stage: head and neck measure 50.7% of
     * the frame, where Patrick's read 46% and Oscar's 33%. A tight crop means
     * a short figure draws a big head, so the suggestion comes back small —
     * and at 561 the card had him floating low in the right half with the
     * middle of it empty, because the figure is anchored to the bottom edge
     * and there was not enough of him to reach up into the card.
     *
     * Sized against Patrick's, the other AI & Applied Innovation card he
     * posts beside: their heads now draw within 4% of each other. It leaves
     * his org line 60px of clearance before his shoulder, which is why
     * "Webhead, Quantum Realm Computing" can stay whole.
     */
    portrait: { height: 780, left: 439 },
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
    // The title firmed up, and splits at its own colon: the half before it
    // is the hook, the half after says what the talk covers. Broken after
    // "the" so "Rest of Us" stays together — it is the phrase that lands.
    headline: "Linux for the<br />Rest of Us",
    headlineSize: 96,
    subtitle: "Freedom, community, and the power of FOSS",
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
    // Behind the name, role and date rather than the gap under the subtitle —
    // the set's placement for Linux San Antonio, as on Satish's card.
    boltTop: 600,
  },

  {
    id: "dotnet-user-group-speaker-jon-roberts",
    event: "dotnet-user-group",
    speaker: "jon-roberts",
    // Two lines, broken before "the Pit" so each half is a phrase and the
    // idiom "pit of success" is never split across the break.
    headline: "Herding Clankers into<br />the Pit of Success",
    headlineSize: 80,
    // The description's argument, not a paraphrase of its opening. The
    // talk's claim is that the prompt is not where agents succeed or fail:
    // the stack and architecture are, and it proves it by walking through an
    // F# codebase. An earlier "Getting AI agents to write reliably good F#"
    // said the opposite, that F# was the output rather than the reason.
    // Also the one place the title explains what a clanker is.
    subtitle:
      // Non-breaking space after "F#" — balanced wrapping otherwise breaks
      // there and strands the language from the word it qualifies.
      "More than the perfect prompt: the F#\u00a0stack that keeps AI agents on track",
    // His CMS record has no title or company, and this template prints the
    // role line regardless. From his bio, which leads with it.
    role: "25 years building software",
    // The probe fails here the way it did on Beck, for a different reason:
    // the silhouette widens at the hat brim, so it measured the brim as the
    // head and asked for 2018, about twice life size. Sized by eye from the
    // hat crown instead. 840 rather than the set's usual 860 because the
    // brim is wider than any head: at 860 its tip ran into the right edge.
    // Here it stops about 30px short.
    portrait: { height: 840, left: 460 },
    // Lowered toward the name, date and room, but only so far: at 700 its
    // lower edge ran behind his right shoulder, and a tint over a figure is
    // the thing this template's note on `.bolt` says to avoid.
    boltTop: 560,
  },

  {
    id: "linux-satx-speaker-satish-mantripragada",
    event: "linux-satx",
    speaker: "satish-mantripragada-mba",
    // The half before the colon, which is the talk's own name for itself. The
    // question after it is the subtitle's job, cut to what it asks.
    // One line. At the set's 96 it runs about 850px, which fits: the title
    // sits well above his head, so nothing on the right is in its way.
    headline: "Agentic Leadership",
    headlineSize: 96,
    subtitle: "How do you bring AI agents into enterprise and government?",
    // "MBA" is part of his CMS name, as "Ph.D." is Corey Hartman's, and it
    // would print as a third word on a two-line name. The card names him; the
    // credential is on his page.
    name: ["Satish", "Mantripragada"],
    // A tight headshot: the head is 47% of the file's height, where the set
    // runs 14–30%, so he is drawn well under the set's 860. The cutout reaches
    // both edges of its file, and at 700 the right one stopped at x=1030 — a
    // straight cut down his shoulder, 50px short of the card. 780 from 480
    // runs it off the edge, as every other figure in the set does.
    portrait: { height: 780, left: 480 },
    // Down behind the name, date and room, as on Jon Roberts's card, instead
    // of the gap under the subtitle.
    boltTop: 600,
  },

  {
    id: "linux-satx-speaker-adam-bark",
    event: "linux-satx",
    speaker: "adam-bark",
    // The title less its "How to", which is what it takes to hold two lines
    // above his head at the set's size; the imperative still says it is a
    // how-to.
    headline: "Manage Your Business<br />with Free Software",
    headlineSize: 88,
    // What the talk actually demos, from the abstract: Odoo Community
    // Edition as the one place for the whole business, minus the lock-in.
    subtitle:
      "Odoo Community Edition: the whole business in one place, without a vendor\u2019s lock-in.",
    // The probe reads his head at 41% of the frame and it is his hair — long,
    // and read as head by the shoulder test, as on Brenda Gentry's card. His
    // face is the set's usual size, and the crop stops short of the file's
    // edges, so the set's usual height.
    portrait: { height: 880, left: 440 },
    // Behind the name, role and date rather than the gap under the subtitle —
    // the set's placement for Linux San Antonio, as on Satish's card.
    boltTop: 600,
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
    // Behind the name, role and date rather than the gap under the subtitle —
    // the set's placement for Linux San Antonio, as on Satish's card.
    boltTop: 600,
  },

  // ─── Venue days ───────────────────────────────────────────────────────────
  /**
   * One card per room per day, posted the morning of.
   *
   * The list is not in here. `venueDay` names a room and a date and the
   * renderer reads that room's sessions for that day out of the CMS — see
   * `venueDay` in render.mjs — so a session moved or added after this was
   * written is on the card the next time it renders, and adding the rest of
   * the week is one entry per room per day with nothing to retype.
   *
   * `event` supplies the room's facts line and template defaults, the same
   * way it does for that room's speaker cards.
   */
  // Friday has nothing on the main stage, so there is no Friday card.
  ...tprDayCards("2026-09-28", "Monday", "September 28"),
  ...tprDayCards("2026-09-29", "Tuesday", "September 29"),
  ...tprDayCards("2026-09-30", "Wednesday", "September 30"),
  ...tprDayCards("2026-10-01", "Thursday", "October 1"),
  ...randDayCards("2026-09-28", "Monday", "September 28"),
  ...randDayCards("2026-09-29", "Tuesday", "September 29"),
  ...randDayCards("2026-09-30", "Wednesday", "September 30"),
  ...randDayCards("2026-10-01", "Thursday", "October 1"),
  ...randDayCards("2026-10-02", "Friday", "October 2"),
  ...libraryDayCards("2026-09-28", "Monday", "September 28"),
  ...libraryDayCards("2026-09-29", "Tuesday", "September 29"),
  ...libraryDayCards("2026-09-30", "Wednesday", "September 30"),
  ...libraryDayCards("2026-10-01", "Thursday", "October 1"),
  ...libraryDayCards("2026-10-02", "Friday", "October 2"),

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
    ...MODEL_POSTER,
    // The page's face for its name — Geist Mono, not the speaker cards'
    // Oswald. See `headlineMono` in activation-poster.html.
    headlineFont: "mono",
  },

  /**
   * The lead, for social: the poster with its node graph animating on, as it
   * does at the top of the activation page.
   *
   * The still stays the art of record — it is the picture every frame of this
   * ends on. What this adds is the thing the page does and a picture cannot:
   * the pointer walking the top row, the wires drawing, the nodes lighting in
   * the order the work actually runs.
   *
   * Frames come from capture-model-flow.mjs, which films the live component
   * rather than re-drawing it, so a change to the graph on the site is a
   * re-capture here rather than a second implementation to keep in step.
   * 60 frames of the site's 1.5s intro play over 2.5s — the reasoning is in
   * that script — with a second of the empty graph first and five of the
   * finished one after.
   */
  {
    id: "the-model-motion",
    ...MODEL_POSTER,
    headlineFont: "mono",
    art: "tools/social-cards/.cache/model-flow/frame-059.png",
    artFrames: {
      dir: "tools/social-cards/.cache/model-flow",
      fps: 24,
      holdStart: 1,
      holdEnd: 5,
    },
  },

  /**
   * The YouTube Short: the running order, a line at a time.
   *
   * The third of these, and the shape is the event's. PySanAntonio reveals
   * seven talks over its own footage; Datanauts shows a two-talk bill with
   * the faces. The Model has eight talks and nine speakers — too many faces
   * for a bill — so the list is the whole card, with nothing behind it.
   *
   * 2.5s a row against PySanAntonio's 3.0. That one was cut to the bar of the
   * track under it; this has no track yet, so the number is a reading speed
   * rather than a tempo. Pick a track and it should be re-cut to its bar:
   * hold = 4 x 60 / BPM.
   *
   * 28 seconds, which is the longest of the three and earns it — eight talks
   * at a length anyone can read is what the card is for.
   */
  {
    id: "the-model-short",
    event: "the-model",
    template: "the-model-short.html",
    size: { width: 1080, height: 1920 },
    // 1, like the other moving cards: a video is transcoded by every platform
    // it touches and the extra sample rate buys nothing.
    scale: 1,
    headline: 'The <span class="panel">Model</span>',
    // The hook's first half only. The second — "an afternoon of showing each
    // other what comes next" — is what the list underneath demonstrates, and
    // printing both would say it twice on one card.
    subtitle: "Creatives, founders and builders in the same room.",
    kicker: "Monday, Sept 28 \u00b7 1 \u2013 6 PM \u00b7 Geekdom, 3rd Floor",
    rows: [
      {
        at: "1:10",
        who: "The Next Era of the Creator Economy",
        what: "Keynote \u00b7 Justin Johnson",
      },
      { at: "2:20", who: "Beyond the Cloud", what: "AJ Rose & Diego Chavez" },
      { at: "2:45", who: "Let the Machines Win", what: "Jonathan Perry" },
      {
        at: "3:10",
        who: "Ship the Story, Not Just the Product",
        what: "Maria Consuelo Gonima",
      },
      { at: "3:35", who: "Beyond the Prompt", what: "Cynthia Gentry" },
      {
        at: "4:00",
        who: "Putting Grok Bot and Agents to Work",
        what: "Leon Hitchens",
      },
      { at: "4:25", who: "Alamo City AI", what: "Building over broadcasting" },
      {
        at: "5:30",
        who: "Storytelling Meets Startup Strategy",
        what: "Daniel Gallegos & Serena Hernandez",
      },
    ],
    ctaLine: "Free with your badge.",
    ctaUrl: "sasw.co/schedule/the-model",
    reveal: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 5.5],
  },

  /**
   * The second slide: the programme, under the line the first slide's hook
   * ends on.
   *
   * "What comes next." was the headline of an earlier Model card and too
   * good to lose with it, and it only works here. On the lead poster it would
   * sit sixty pixels above the hook's own "what comes next"; over the lineup
   * it points at something — the next five hours — and the keynote opening
   * them is titled "…and what to build next". The lead says what The Model
   * is; this says what happens in it.
   *
   * No hook: it would repeat the headline. No art: the rows take its slot.
   *
   * Titles are cut to what is legible at this size, each from its own talk
   * page; the full ones are a tap away. Alamo City AI has no speaker and a
   * title that is its own name, so its second line is the description's own
   * phrase, "building over broadcasting". Daniel before Serena, as the
   * organisers asked on their card.
   */
  {
    id: "the-model-lineup",
    ...MODEL_POSTER,
    art: null,
    // Names the event, where the lead's eyebrow names the room: the lead has
    // "THE MODEL" as its headline, and this slide — shared on its own, as a
    // second slide often is — would otherwise not say what it is the lineup of.
    eyebrow: "// The Model \u00b7 AI & Applied Innovation",
    headline: "What comes next.",
    headlineSize: 104,
    subtitle: "",
    rows: [
      {
        at: "1:10",
        who: "The Next Era of the Creator Economy",
        what: "Keynote \u00b7 Justin Johnson",
      },
      { at: "2:20", who: "Beyond the Cloud", what: "AJ Rose & Diego Chavez" },
      { at: "2:45", who: "Let the Machines Win", what: "Jonathan Perry" },
      {
        at: "3:10",
        who: "Ship the Story, Not Just the Product",
        what: "Maria Consuelo Gonima",
      },
      { at: "3:35", who: "Beyond the Prompt", what: "Cynthia Gentry" },
      {
        at: "4:00",
        who: "Putting Grok Bot and Agents to Work",
        what: "Leon Hitchens",
      },
      { at: "4:25", who: "Alamo City AI", what: "Building over broadcasting" },
      {
        at: "5:30",
        who: "Storytelling Meets Startup Strategy",
        what: "Daniel Gallegos & Serena Hernandez",
      },
    ],
  },

  /**
   * The lockpicking village, which is not a talk.
   *
   * It runs the whole five hours rather than taking a slot, and nobody gives
   * it — so it takes the `art` path the event card uses, with Alamo City
   * Locksport's own mark in the figure's place and no name block under it.
   *
   * Their new autumn mark rather than the line-art one in the organiser strip
   * at the foot of every card on this template: the strip says who is running
   * the day, and this card is about one of the six in particular, so the two
   * should not be the same picture at two sizes.
   */
  {
    id: "access-granted-locksport-village",
    event: "access-granted",
    art: "public/access-granted/orgs/locksport-fall.png",
    // The line-art cut in the strip, not the autumn one the event now uses:
    // this card's picture is already the autumn mark, and the same artwork
    // twice on one card at two sizes reads as a mistake.
    logos: ACCESS_ORGS(LOCKSPORT_LINE),
    // One row, not this template's usual two of three. The two-row grid is
    // there because a standing figure reaches down into the strip and leaves
    // it about 410px; the mark on this card sits high and clears the foot
    // entirely, so all 936px are free and six marks across draw 682.
    logoCols: 6,
    headline: "Lock Picking<br />Village",
    headlineSize: 118,
    // Their sentence, and the one that says why a lockpicking table belongs
    // at a security day rather than at a fair: "Understanding how a lock
    // fails is how you learn to protect yourself and the people around you."
    // The welcome is theirs too, and it is the fact most likely to decide
    // whether somebody brings their kid.
    subtitle:
      "Understanding how a lock fails is how you learn to protect yourself. All ages welcome.",
    // The hours, because "drop in whenever" is the whole point — every other
    // card on this template names a day and a floor and lets the running
    // order carry the time. Split across both slots rather than packed onto
    // the first: whole, the day and the hours draw 568px and run under the
    // mark's lower-left corner.
    facts: [
      "Wednesday, September 30",
      "1 \u2013 6 PM  \u00b7  Geekdom, 3rd Floor",
    ],
    /**
     * Landscape, where this slot was drawn for a standing figure.
     *
     * Their mark is 1.41:1, so height sets a width of 1.41x rather than the
     * 0.46x a headshot gives: 370 high draws 522 across, and at left 555 that
     * lands flush on the card's right edge.
     *
     * A standing figure works on this template because it is narrow where the
     * copy is tall; a wide mark is not, so it takes the one band that is
     * clear of both — below the hook, which reaches x=570, and above the
     * facts, whose second line reaches x=492. That band is y 660 to 1030, and
     * 370 is what fits it.
     *
     * Lifted off the bottom rather than bled off it. A cutout of a person is
     * cropped at the frame and bleeding is the point; a mark sitting flush on
     * the card's edge reads as artwork that did not fit — the same note
     * `portraitBottom` carries in render.mjs.
     */
    /**
     * Whose village it is, in the slot a speaker card gives the speaker.
     *
     * Their autumn mark carries no wordmark — it is an Alamo built out of
     * leaves with a keyhole in it — so a reader who does not already know the
     * group cannot name them from the picture, and the line-art version in
     * the strip below is 40px wide. The one place on this template that says
     * who a card is about is the name block, and for this card that is a
     * group rather than a person.
     */
    name: ["Alamo City", "Locksport"],
    role: "Hosting the village",
    // No article: this slot sets in mono caps, where "A TOOOL AFFILIATE"
    // reads as a sentence that lost its verb rather than as the label it is.
    org: "TOOOL affiliate",
    portrait: { height: 370, left: 555, bottom: 320 },
  },

  { ...MIKE_BELL, id: "access-granted-speaker-mike-bell" },
  // The same card desaturated. His picture is the only colour on this
  // template's black and green, and it is a photograph rather than a
  // headshot — mono reads as a poster where the colour cut reads as a
  // snapshot. Both ship; pick per placement.
  { ...MIKE_BELL, id: "access-granted-speaker-mike-bell-bw", greyscale: true },

  {
    id: "access-granted-speaker-corey-hartman",
    event: "access-granted",
    // "corey-hartman-ph-d", because that is the slug his CMS record carries —
    // his name is entered as "Corey Hartman, Ph.D." and the card splits it
    // the way it splits any other: "Corey" over "Hartman, Ph.D.".
    speaker: "corey-hartman-ph-d",
    // The title's own colon. "Glyph" is the thing being announced and the
    // rest is what it does — the same split `samad-ahmed` makes, where the
    // headline is the idea and the subtitle is the project.
    headline: "Glyph",
    // One word, so it is set to fill rather than to the set's 118: at 176
    // "GLYPH" draws 429px, which is where a single word stops reading as a
    // headline that lost its second line.
    headlineSize: 176,
    subtitle: "A binary analysis tool powered by machine learning.",
    /**
     * Wider than a person, because it is not one: his headshot in the CMS is
     * a drawn frog in a lab coat with his name on the badge. The picture is
     * 1.03:1 against a headshot's usual 0.46:1, so the set's 918 would put
     * him 300px off the card.
     *
     * `left` is 520 rather than the set's 442 because his name is entered
     * as "Corey Hartman, Ph.D." and sets two lines deep — "HARTMAN, PH.D."
     * reaches x=490 where "HARTMAN" stopped at 400, and at 442 the frog's
     * head sat on the full stop. At 520 the figure ends exactly on the card's
     * right edge and the copy has 30px of air.
     *
     * `bottom` because the file has 141px of empty alpha under the figure and
     * this template anchors to the frame rather than the ink. At 700 that is
     * 73px of float; -77 lands the hand flush on the card's edge.
     */
    portrait: { height: 700, left: 520, bottom: -77 },
  },

  {
    id: "access-granted-speaker-keeban-villarreal",
    event: "access-granted",
    speaker: "keeban-villarreal",
    // The title, whole. "Q-Day" is the hook and it is already in it, so
    // there is nothing for a coined headline to add — `dante-moreno` gets one
    // because "A Look at the Gayfemboy Malware" buries its own.
    //
    // 118, this template's size: "HOW TO PREPARE" is 14 characters, which
    // Oswald draws at 804px of the 936 the frame allows.
    headline: "How to Prepare<br />for Q-Day",
    headlineSize: 118,
    // The abstract, shortened to the measure. Its own sentence runs 121
    // characters and sets to five lines in the 520px rule; this keeps both
    // halves — where you are going and why the date matters.
    subtitle:
      "A practical roadmap to post-quantum cryptography, before today\u2019s encryption is obsolete.",
    portrait: { height: 918, left: 442 },
  },

  {
    id: "access-granted-speaker-gabriel-green",
    event: "access-granted",
    speaker: "gabriel-green",
    // UTSA Cyber Jedis' second talk — the one `ACCESS_BLOCKS` in
    // lib/access-granted.ts was waiting for. It lands inside their window, so
    // the event page credits it to them without anything changing there.
    //
    // 104, not the 118 Keeban's card beside it uses: "DATA BATTLEFIELDS" is
    // 17 characters against his 14, which at 118 runs past the 936 the frame
    // allows.
    headline: "The New Age of<br />Data Battlefields",
    headlineSize: 104,
    // The abstract, tightened: "an informational session on the growing
    // field of cyberwarfare and all the nations within it".
    // No-break before "it", which the 520px rule otherwise strands alone.
    subtitle: "Cyberwarfare, and the nations fighting\u00a0it.",
    // A tight headshot — the head is 43% of the file, where the set runs
    // 14–30% — so well under the set's 918, and placed to run off the right
    // edge as every figure on this template does.
    portrait: { height: 760, left: 480 },
  },

  {
    id: "access-granted-keynote-richard-davey",
    event: "access-granted",
    speaker: "richard-davey",
    // The title landed, so it takes the headline and the marker drops to the
    // subtitle — `pysanantonio-speaker-mason-egger` does the same for the
    // same reason, and the phrasing is its.
    headline: "Trust Each Other,<br />Not Technology",
    headlineSize: 104,
    subtitle: "The opening keynote",
    // His CMS record has the title and no company. The bio there names it —
    // "Currently serving as Director of Security at HackerOne" — and a
    // keynote card with a role and no organisation under it reads like a
    // field nobody filled in. Set here rather than in the CMS, so his
    // speaker page and this card disagree until somebody fixes the record;
    // same trade `mason-egger` makes, same note in the README.
    org: "HackerOne",
    portrait: { height: 918, left: 442 },
  },

  {
    id: "access-granted-speaker-jacob-wellnitz",
    event: "access-granted",
    speaker: "jacob-wellnitz",
    /**
     * The whole title, broken at its own full stop.
     *
     * That stop is the talk's shape — an incident that is over and an
     * investigation that has not started — so the line break lands on it and
     * the question keeps the second line to itself.
     *
     * 108, not this template's 118: "THE HACKERS LEFT." is 17 characters,
     * which Oswald draws at 911px of the 936 the frame allows. At 118 it runs
     * to 977 and wraps on its own, which puts "LEFT." on a line of its own
     * and the question on a third.
     */
    headline: "The Hackers Left.<br />Now What?",
    headlineSize: 108,
    // The abstract's own opening, which is three short sentences where the
    // title is two — it sets the scene the title's full stop implies rather
    // than restating it.
    subtitle:
      "The attackers are gone. Systems are down. Everyone wants to know what happened.",
    portrait: { height: 918, left: 442 },
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
