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

export const EVENTS = {
  ...COMMUNITY,

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
      { partner: "The Creative Futures", height: 84 },
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
      { partner: "The Creative Futures", height: 84 },
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

  // ─── Texas Public Radio ───────────────────────────────────────────────────
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
    headline: "Cybersecurity for<br />Small Businesses",
    // The longest of the five: the tag runs "SMALL BUSINESS & SOLOPRENEUR ·
    // MAIN STAGE", ~705px against the 936px measure, and clears.
    circuit: "Small Business & Solopreneur",
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
