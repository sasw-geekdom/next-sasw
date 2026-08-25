import type { ToolMarkName } from "@/lib/tool-marks";

// The Model — the third activation inside Startup + Tech Week with a brand of
// its own, and the only one whose brand is a piece of artwork rather than a
// palette described in prose.
//
// Modelled on lib/access-granted.ts and lib/pysa.ts deliberately: an activation
// big enough to carry its own band gets its own constants file, so the band,
// the page, the calendar entry and the structured data all read the same values
// and cannot drift about when or where it runs.
//
// ── The system comes from the picture ───────────────────────────────────────
//
// This file used to hold the "Retro-Cyber Precision" sheet — phosphor amber,
// CRT scanlines, a schematic grid, a near-black canvas. That is gone. The
// hero artwork (public/the-model/code-select.png) is the system now: a
// click-drag selection climbing a staircase of code, every rung caught at a
// different extent in a different selection colour.
//
// So the band is built the way an editor is. Ground is black. Code-coloured
// type. And the one gesture the whole identity rests on — a selection block
// with its ink knocked out — is what the wordmark and the labels use.
//
// The three things that went with the old sheet, and why nothing replaced them:
// the amber is gone because the picture brings its own colour and a second
// accent argued with it; the schematic grid is gone because the artwork has its
// own left edge running off-frame and a grid behind it read as two competing
// rulings; the panel is gone because a bordered surface beside an artwork that
// floats on black made the picture look pasted onto a card.

/**
 * The selection palette, sampled from the artwork itself rather than picked to
 * sit beside it — these are the actual block colours, by share of ink.
 *
 * Orange is deliberately absent. It is the artwork's second most common colour
 * (12%), and it is exactly the hue the old amber accent occupied, so anything
 * of ours set in it read as the discarded system hanging on rather than as the
 * picture's own voice. Ours takes the colours the artwork has that the old
 * sheet never did.
 */
export const MODEL_LAVENDER = "#C0B4FC"; // 19.5% of the artwork — its ground note

/**
 * The same lavender lifted about 18% toward white, for one hover state and
 * nothing else: the Claude Code node in the hero graph, which is the only node
 * that does anything when clicked.
 *
 * A held colour rather than a `brightness()` filter, which was the obvious way
 * to do this over an inline background. #C0B4FC is rgb(192 180 252) — a filter
 * pushes blue past 255, so the channel clamps while red and green keep rising
 * and the lift arrives slightly pink. Mixing toward white keeps the hue and
 * only moves the value, which is what "a step up" should mean. A filter would
 * also have lifted the near-black ink and the mark sitting on the block.
 *
 * The lift is small on purpose. It has to be unmistakable to someone already
 * hovering and invisible to everyone else — see the note on `Node`.
 */
export const MODEL_LAVENDER_LIT = "#CBC2FD";
export const MODEL_CYAN = "#00B4FC"; // 10.3%
export const MODEL_BLUE = "#4848FC"; // 7.0%
export const MODEL_RED = "#FC3030"; // 5.8%

// Green (#60FC78, 9.2% of the artwork) is deliberately absent for the same
// kind of reason as the orange, but a harder one: Access Granted already owns
// green on this site. ACCESS_GREEN is #00ff66, and a second activation running
// a near-neighbour of it would make two full-day takeovers on the same schedule
// page read as one programme in two colours. It stays in the picture, because
// that is the artwork; it takes nothing of ours.
//
// So: lavender is the mark colour (the wordmark's selection, the `//` that
// opens each label) and cyan is the functional accent (the tagline's rule, the
// metadata icons, the second selection, the button's arrow). Two jobs, two
// colours, and neither of them is anybody else's.

/** The ink a selection block knocks out. Near-black, never pure. */
export const MODEL_INK = "#09090B";

export const THE_MODEL = {
  name: "The Model",
  dateLabel: "Monday, September 28, 2026",
  timeLabel: "1:00 – 6:00 PM",
  venue: "Geekdom",
  venueDetail: "3rd Floor",

  // The afternoon's format — an opening keynote, then local builders on their
  // production stacks — is deliberately not here. It rendered as its own block
  // under the metadata for one build and made the copy column busier than the
  // section could carry; the organisers are handling how the week explains
  // what registration gets you, and that is the better place for it. Same for
  // access: every activation is free with a Startup + Tech Week registration,
  // which is a fact about the week rather than about this event, and no sibling
  // band states it either.

  /**
   * The hook, in two halves — and two halves is the specification, not an
   * implementation detail.
   *
   * ── It is an event, and it does not sell anything ─────────────────────────
   *
   * This is the correction that matters most, because it took three passes to
   * get right and every wrong version was wrong the same way.
   *
   * It began as "Code, design and generative media in one room" — accurate, and
   * led with the wrong noun: `code` first tells a designer the afternoon is not
   * for them. Rewritten against elevenlabs.io/creative and runway.com, it
   * became "Turn ideas into finished image, film and voice." Better lens,
   * worse category error: those are product sites, and their register is a
   * capability promise. An event cannot turn anyone's ideas into anything. That
   * sentence sells a tool this activation does not have.
   *
   * What The Model actually is, in the organisers' own words, is "a
   * community-driven activation bringing San Antonio's creative economy
   * directly into the same room with the DEVSA community". So the hook names
   * the two rooms and the occasion, and nothing else. No imperative, no second
   * person, no promise of an outcome to the reader.
   *
   * Borrow those sites for *vocabulary* — the craft nouns, "recipes" over
   * "production stacks" — and never for sentence shape. They are selling; this
   * is inviting.
   *
   * The setup's three nouns run in the same order as the three logos in the
   * `// powered by` row directly beneath them — creatives/Creative Futures,
   * founders/Tech Bloc, developers/DEVSA. Nothing labels that mapping and
   * nothing needs to; the order is the entire mechanism. It is also load-bearing
   * now: reorder MODEL_ORGANIZERS and this line quietly stops working.
   *
   * The turn has no subject on purpose. Every version that named a doer —
   * "how the work gets made" (nobody in it, so the work made itself), then
   * "showing how they work", then "showing how they iterate" — re-narrowed the
   * line above it, because whatever noun lands in that slot reads as one of the
   * three groups rather than all of them. "builders" was the worst of them:
   * it is DEVSA's own word for developers, so the turn handed a three-party
   * afternoon back to one party. "iterate" failed the same way through
   * vocabulary rather than grammar — founder-and-engineer dialect, which means
   * the sentence meant to unify was written past the creatives in it.
   *
   * "each other" is what replaced the doer. It is reciprocal, so it points at
   * all three groups at once without counting them again, and it is the only
   * phrasing tried here that argues the same thing the first line does: a room,
   * mutual, nobody presenting at anybody.
   *
   * The turn closed on "how it gets made" until the programme was set. That
   * described the format correctly and the subject backwards: the afternoon
   * opens with a thirty-minute keynote on what is coming and then runs talks on
   * virtual reality, audio, Claude, and image and video models. "What comes
   * next" is the day. Everything else about the line is deliberately untouched
   * — same shape, same absent subject, same "each other" — because the reason
   * it took four passes to arrive at was never the last three words.
   *
   * Both halves are 52 characters — over the ~48 the older two-noun setup was
   * held to, and measured rather than assumed: each still holds its own line
   * from `lg` up. Treat it as the ceiling. One more word either side and the
   * block goes to three rows, which is the thing this hook was cut down to
   * avoid in the first place.
   */
  tagline: {
    setup: "Creatives, founders and developers in the same room.",
    turn: "An afternoon of showing each other what comes next.",
  },


  // The opening talk used to live here and render as a selected line on the
  // masthead. Taken off the page by request — the fact still reaches readers
  // through `blurb` in lib/schedule.ts, which feeds the page metadata, the .ics
  // and the Event markup, so nothing was lost from the record; only the hero
  // stopped naming a session.
  //
  // It was "State of the Creative Economy in 2026". It is now a thirty-minute
  // keynote, "The Next Era of the Creator Economy", and the afternoon behind it
  // is talks on virtual reality, audio, Claude, and image and video models.
  //
  // Creator, not creative, and that is deliberate rather than a slip — worth
  // knowing because everything else on this activation says creative economy,
  // twice, in the organisers' own words. The two are different: the sector
  // this room convenes, and the subject that keynote takes. Do not "fix" one
  // into the other.
  //
  // The keynote and every talk under it belong in the sessions CMS pointed at
  // `the-model`, not in this file. CMS rows supersede anything hardcoded, so a
  // title added here would only have to be removed again.
} as const;

// ── Option A: two columns that meet ────────────────────────────────────────
//
// The staircase version is below, kept and unused — see MODEL_ARTWORK. This is
// the layout that replaced it, and the reasoning is worth keeping because it is
// mostly a list of things taken away.
//
// The staircase had grown to eighteen rows, thirty-four colour blocks in nine
// hues, sixteen marks and nine lines of background prompt. Four separate
// problems, only one of which was volume:
//
//   · colour encoded nothing. The source art's colours were arbitrary because
//     it was a screenshot of a real editor; we kept the randomness and then
//     added meaning (modality tags, two groups) beside it, so nine hues looked
//     like they were saying something and weren't.
//   · no hierarchy — eighteen rows at one size, one weight, one saturation.
//   · two organising systems arguing: a diagonal, which implies flow, and
//     group headers, which imply discrete sets.
//   · the backdrop was type behind type, so it read as clutter rather than as
//     depth. Access Granted's grid works because it is geometry behind an
//     object, a different register entirely.
//
// So: two columns, tools on the left and models on the right, meeting at a
// seam. The layout is the message — the event's whole claim is that these two
// halves are one room. Colour now has exactly one job (which side you are on),
// the tag has exactly one job (modality), and nothing encodes the same axis
// twice. Six a side, because "coming together" wants two things of equal size.
//
// The marks stay: they are the only element that was carrying its weight.

export interface ModelColumnRow {
  /** The name, which is what takes the selection block. */
  t: string;
  /** Discipline on the left, modality on the right. Set outside the block. */
  tag: string;
  icon?: ToolMarkName;
}

/**
 * The left column — the studio. What the work actually gets made in.
 *
 * Three design surfaces and three coding agents, which is the split the room
 * itself has. Claude Code, Codex and Cursor moved over from the model side on
 * the way here: they are things you sit inside all day, not things you call.
 *
 * Headed `// studio` rather than `// tools` for the same reason the hook was
 * rewritten — "tools" is a builder's word for the same objects a creative
 * director would call a studio, and this page now leads with the second
 * reading. The right column keeps `// ai models`, which is what it is.
 */
export const MODEL_TOOLS: readonly ModelColumnRow[] = [
  { t: "figma", tag: "design", icon: "figma" },
  { t: "firefly", tag: "design", icon: "adobe" },
  { t: "higgsfield", tag: "video", icon: "higgsfield" },
  { t: "cursor", tag: "code", icon: "cursor" },
  { t: "claude-code", tag: "code", icon: "claudecode" },
  { t: "codex", tag: "code", icon: "codex" },
];

/**
 * The right column — what it calls.
 *
 * Real ids from vercel.com/ai-gateway/models, two per modality. It was twelve;
 * six is what balances the columns, and two of a kind is enough to show that a
 * modality has a choice in it without listing a catalogue.
 */
export const MODEL_MODELS: readonly ModelColumnRow[] = [
  { t: "flux-2-pro", tag: "image", icon: "flux" },
  { t: "gpt-image-2", tag: "image", icon: "openai" },
  { t: "s2.1-pro", tag: "audio", icon: "fishaudio" },
  { t: "grok-tts", tag: "audio", icon: "grok" },
  { t: "seedance-2.5", tag: "video", icon: "bytedance" },
  { t: "veo-3.1", tag: "video", icon: "gemini" },
];

// ── The backdrop ───────────────────────────────────────────────────────────
//
// Access Granted's hero fills its black with a schematic grid and the light its
// padlock casts. This band had the same two layers once and lost them: the grid
// fought the artwork's own ruling, and the glow was the retired sheet's amber
// sitting warm under a picture whose colours are cool. The space they left is
// real though — the staircase runs top-right to bottom-left, so the corners
// opposite it are empty.
//
// What goes there instead is the one thing the artwork implies but never shows.
// The rows name what gets called; these are what gets sent — the prompts,
// settings and takes that go into a video, audio, image or code model. True to
// the subject, specific rather than decorative, and quiet enough that the
// picture in front stays the picture.
//
// Positions are percentages of the artwork's own box, hand-placed into the two
// empty corners: the top-left triangle above the staircase and the bottom-right
// one below it. Anything moved needs checking against the diagonal, because the
// whole point is that these never sit behind a row.

export interface ModelInput {
  /** The input itself. Kept short — these must not wrap. */
  t: string;
  /** Which kind of model it would be sent to. */
  tag: "video" | "audio" | "image" | "code";
  /** Percent of the artwork box, from its left and top edges. */
  x: number;
  y: number;
}

export const MODEL_INPUTS: readonly ModelInput[] = [
  // Top-left: above the staircase.
  { t: '"slow push-in, 35mm, golden hour"', tag: "video", x: 1, y: 4 },
  { t: "duration: 8s · 1080p · silent", tag: "video", x: 5, y: 15 },
  { t: '"warm narrator, unhurried"', tag: "audio", x: 0, y: 27 },
  { t: "voice: en-US · 24kHz · wav", tag: "audio", x: 7, y: 38 },
  { t: '"iso type, black ground"', tag: "image", x: 2, y: 50 },
  // Bottom-right: below it.
  { t: '"refactor auth to session cookies"', tag: "code", x: 61, y: 62 },
  { t: "diff --staged · 3 files", tag: "code", x: 63, y: 73 },
  { t: "transcribe(take_04.wav)", tag: "audio", x: 57, y: 84 },
  { t: "seed: 2026 · steps: 40", tag: "image", x: 68, y: 94 },
] as const;

// ── The artwork, as data ────────────────────────────────────────────────────
//
// public/the-model/code-select.png transcribed so it can move. Everything below
// was measured off that file rather than invented: 14 rows on a ~32.5px pitch,
// a ~23.1px character advance, and per-row indents derived from each row's
// right edge minus its own length.
//
// The indents are irregular on purpose — the source is hand-composed, not a
// fixed staircase, and regularising them straightened out the one thing that
// makes the silhouette look drawn rather than generated.
//
// Colours are the artwork's own, sampled from it. That includes the green and
// the orange this band otherwise refuses: those two are barred from *our*
// chrome (green belongs to Access Granted, orange to the retired sheet), and
// this is not our chrome — it is the picture, which keeps its palette.

/** The artwork's block colours, by share of ink. */
const ART = {
  coral: "#FC6C30",
  lavender: "#C0B4FC",
  cyan: "#00B4FC",
  green: "#60FC78",
  blue: "#4848FC",
  red: "#FC3030",
  forest: "#005430",
  maroon: "#6C1818",
  white: "#F0F0F0",
} as const;

export interface ModelArtSegment {
  t: string;
  /** Selection block. */
  bg: string;
  /** The ink it knocks out. */
  fg: string;
  /**
   * A tool mark rendered immediately before this segment's text, inheriting
   * `fg` so it is knocked out of the block exactly like the type is.
   *
   * Marks are placed on a *segment* rather than a row so they can be positioned
   * within it — a mark belongs next to the call it names, not at the start of
   * whatever row that call happens to sit on.
   *
   * Only AI models carry one. Cursor, Figma and Adobe had marks briefly and
   * lost them: an editor and two design suites are tools the afternoon uses,
   * not models it is about, and ten marks had turned the artwork into a logo
   * wall.
   */
  icon?: ToolMarkName;
}

export interface ModelArtLine {
  /**
   * Left offset in characters, and negative is meaningful: the source art runs
   * off its own left edge, and these rows are the ones doing it.
   */
  indent: number;
  segs: readonly ModelArtSegment[];
}

/**
 * Character cells a tool mark occupies.
 *
 * It has to be an exact number of cells, not "whatever the SVG is". The
 * selection width is computed in `ch` from the row's length, so anything in a
 * row that isn't measured in characters puts the block out of step with the
 * text inside it — the highlight would stop short of the glyphs by the width of
 * every icon before it. Two cells: the mark plus its trailing space.
 */
export const MODEL_ICON_CH = 2;

/**
 * SUPERSEDED by MODEL_TOOLS / MODEL_MODELS above — nothing renders this now.
 * Kept because it is uncommitted and the columns are an exploration; delete it
 * once they are settled.
 *
 * The eighteen rows, top first — two labelled groups.
 *
 * ── Models, then tools ──────────────────────────────────────────────────────
 *
 *   // ai models   what the room calls, tagged by modality: code, image, audio, video
 *   // tools       what it calls them through
 *
 * The models lead because they are the subject; the tools are how you reach
 * them. That is also the order the pointer works in — it walks from the top, so
 * the models light first and the tools finish the picture.
 *
 * Model ids come from vercel.com/ai-gateway/models rather than being picked by
 * hand — they are real entries in that catalogue, and half the point of the
 * picture is that someone in this audience will recognise every line. The tools
 * are not on the gateway and are not meant to be; they are the surfaces those
 * models get used through, which is a different and equally real half of the
 * afternoon.
 *
 * DeepSeek is deliberately absent as a separate name — per the organisers it
 * was acquired, so its work sits inside another row. Cursor went the same way
 * briefly and came back: it was acquired by SpaceX rather than by anyone else in
 * this list, so it holds its own line. Higgsfield's mark came from its own site
 * rather than lobe-icons; see lib/tool-marks.ts.
 *
 * The staircase is the drawing, so `indent` descends monotonically from 26.5 to
 * -5 across all eighteen; right edges are free to be ragged, which is what the
 * source does. Reordering rows means re-spacing every indent, not swapping two.
 */
export const MODEL_ARTWORK: readonly ModelArtLine[] = [
  {
    indent: 26.5,
    segs: [
      { t: "// ai models", bg: ART.forest, fg: ART.lavender },
    ],
  },
  {
    indent: 24.65,
    segs: [
      { t: "claude-code", icon: "claudecode", bg: ART.blue, fg: ART.coral },
      { t: " code", bg: ART.cyan, fg: ART.white },
    ],
  },
  {
    indent: 22.79,
    segs: [
      { t: "codex", icon: "codex", bg: ART.lavender, fg: ART.red },
      { t: " code", bg: ART.green, fg: ART.maroon },
    ],
  },
  {
    indent: 20.94,
    segs: [
      { t: "grok", icon: "grok", bg: ART.cyan, fg: ART.white },
      { t: " code", bg: ART.coral, fg: ART.white },
    ],
  },
  {
    indent: 19.09,
    segs: [
      { t: "flux-2-pro", icon: "flux", bg: ART.red, fg: ART.blue },
      { t: " image", bg: ART.lavender, fg: ART.coral },
    ],
  },
  {
    indent: 17.24,
    segs: [
      { t: "gpt-image-2", icon: "openai", bg: ART.green, fg: ART.maroon },
      { t: " image", bg: ART.blue, fg: ART.white },
    ],
  },
  {
    indent: 15.38,
    segs: [
      { t: "recraft-v4.1", icon: "recraft", bg: ART.lavender, fg: ART.coral },
      { t: " image", bg: ART.cyan, fg: ART.white },
    ],
  },
  {
    indent: 13.53,
    segs: [
      { t: "s2.1-pro", icon: "fishaudio", bg: ART.blue, fg: ART.coral },
      { t: " audio", bg: ART.green, fg: ART.maroon },
    ],
  },
  {
    indent: 11.68,
    segs: [
      { t: "grok-tts", icon: "grok", bg: ART.forest, fg: ART.lavender },
      { t: " audio", bg: ART.coral, fg: ART.white },
    ],
  },
  {
    indent: 9.82,
    segs: [
      { t: "whisper-1", icon: "openai", bg: ART.cyan, fg: ART.white },
      { t: " audio", bg: ART.lavender, fg: ART.coral },
    ],
  },
  {
    indent: 7.97,
    segs: [
      { t: "seedance-2.5", icon: "bytedance", bg: ART.lavender, fg: ART.coral },
      { t: " video", bg: ART.red, fg: ART.blue },
    ],
  },
  {
    indent: 6.12,
    segs: [
      { t: "kling-v3.0-t2v", icon: "kling", bg: ART.green, fg: ART.maroon },
      { t: " video", bg: ART.cyan, fg: ART.lavender },
    ],
  },
  {
    indent: 4.26,
    segs: [
      { t: "veo-3.1", icon: "gemini", bg: ART.lavender, fg: ART.red },
      { t: " video", bg: ART.coral, fg: ART.white },
    ],
  },
  {
    indent: 2.41,
    segs: [
      { t: "// tools", bg: ART.forest, fg: ART.lavender },
    ],
  },
  {
    indent: 0.56,
    segs: [
      { t: "cursor", icon: "cursor", bg: ART.blue, fg: ART.white },
      { t: " editor", bg: ART.lavender, fg: ART.coral },
    ],
  },
  {
    indent: -1.29,
    segs: [
      { t: "figma", icon: "figma", bg: ART.red, fg: ART.blue },
      { t: " design", bg: ART.coral, fg: ART.white },
    ],
  },
  {
    indent: -3.15,
    segs: [
      { t: "firefly", icon: "adobe", bg: ART.cyan, fg: ART.white },
      { t: " design", bg: ART.coral, fg: ART.white },
    ],
  },
  {
    indent: -5.0,
    segs: [
      { t: "higgsfield", icon: "higgsfield", bg: ART.lavender, fg: ART.coral },
      { t: " video", bg: ART.green, fg: ART.maroon },
    ],
  },
] as const;

/**
 * The staircase of code the hero's selection climbs. Top line first.
 *
 * Every tool the brief names is in here, but as a call inside working code
 * rather than as a bullet in a list — which is the difference between saying an
 * afternoon is about production stacks and showing one. The lines alternate
 * between the two halves of the event's own sentence: shader and simulation
 * maths for the technical architecture, model calls for the generative media,
 * and a render and an export at either end because that is what a production
 * actually starts and finishes with.
 *
 * Deliberately plausible rather than runnable. It reads as a working file at a
 * glance and nobody is meant to compile it; inventing an API signature that
 * looks real but isn't would be worse than this, which is obviously a montage.
 *
 * Two constraints if these are edited. Keep them close in length — the
 * staircase is the picture, and one line twice its neighbours' length puts a
 * spur through it. And keep the longest under about 34 characters, past which
 * the block outgrows the column at laptop width and the top rungs clip on the
 * right, where the cursor and the whole point of the image are.
 */
export const MODEL_CODE = [
  "// the_model · sept 28 · 1–6 pm",
  "field = curl(noise(p * 0.4 + t))",
  "render(unreal, seq, 24fps)",
  "z = fbm(vec3(uv * 8.0, t * 0.01))",
  "runway.generate(shot, seed)",
  "hue = (t * 20.0) % 360.0",
  "elevenlabs.speak(script, voice)",
  "warp += noise(p * 4.0) * 0.02",
  "claude.code(spec) -> prod",
  "seedance.motion(beats: 4)",
  "pos += (target - pos) * 0.08",
  "omni.stream(live)",
  "export(master, 4k)",
] as const;

/**
 * The selection blocks cycle through these, one per line — the same palette the
 * band uses, so the CSS version and the artwork would agree if it ever renders
 * again. Used only by the superseded ModelSelection; see the note at the top of
 * that file.
 *
 * Every one takes near-black ink, which is what makes them read as selections
 * rather than as highlights: a selection inverts, and at these sizes only a
 * fully knocked-out block does.
 */
export const MODEL_SELECTION_TINTS = [
  MODEL_LAVENDER,
  MODEL_CYAN,
  MODEL_BLUE,
  MODEL_RED,
] as const;

interface ModelOrganizer {
  name: string;
  /**
   * Case-insensitive substring of the CMS partner's name.
   *
   * All three hosts are already on the partner wall, so their marks come from
   * Firestore rather than from files committed here — the same `logoFromPartner`
   * bargain the schedule cards make. The logo then tracks whatever the admin
   * uploads and can't fall out of date in this file.
   */
  partner: string;
  /** Used only when the partner row carries no `link`. */
  href?: string;
  /** Used only when the partner row is missing or carries no `imageUrl`. */
  logo?: string;
  heightClass: string;
}

/**
 * The three hosts, in the order the attribution block names them:
 * "Powered by The Creative Futures | Tech Bloc | DEVSA".
 *
 * Unlike ACCESS_ORGANIZERS these are resolved at render time — see
 * `modelOrganizers`. An org that matches no partner and has no local fallback
 * is dropped rather than rendered as a broken image, so a partner row that
 * hasn't been entered yet costs a mark and not the wall.
 */
export const MODEL_ORGANIZERS: readonly ModelOrganizer[] = [
  {
    name: "The Creative Futures",
    partner: "creative futures",
    href: "https://www.thecreativefutures.com/",
    // The tallest of the three, because it is a fine-lined circular badge with
    // its wordmark set around the ring — matched to the flat 36px these all
    // started on, the ring collapsed and the name in it was unreadable. A
    // near-square mark needs more height than a wide wordmark to carry the same
    // weight, and a detailed one needs more still.
    //
    // 56px, not the 80 this briefly ran at. At 80 the row stopped being a
    // credit line and started competing with the wordmark above it; the test
    // for this wall is whether the ring reads, and it does here.
    heightClass: "h-12 sm:h-14",
  },
  {
    // No fallback href: satechbloc.com is the obvious guess and a guess is not
    // a link to publish. The partner row's own `link` supplies it, and until
    // then the mark renders unlinked, which OrganizerLogo already handles.
    name: "Tech Bloc",
    partner: "tech bloc",
    // A step under The Creative Futures rather than level with it. This mark is
    // a solid filled box and that one is thin line work on open ground, so at
    // matched box heights the red slab reads as the biggest thing in the row by
    // some way. Down a step is what puts them level to the eye, which is the
    // thing being matched.
    heightClass: "h-10 sm:h-12",
  },
  {
    name: "DEVSA",
    partner: "devsa",
    href: "https://www.devsa.community/",
    // The one local fallback, because DEVSA's mark is already in the repo for
    // Access Granted — this band should never lose the host that convenes it
    // to a Firestore hiccup.
    logo: "/access-granted/orgs/devsa.png",
    // Between the two. Unlike Tech Bloc this is an open lockup — a thin rule of
    // colour bars over a wordmark — so it needs more height than the solid box
    // to carry the same weight, but less than the circular badge, whose ink is
    // spread around a ring rather than stacked.
    heightClass: "h-11 sm:h-13",
  },
] as const;

/**
 * Resolve the "powered by" wall against the CMS partner list.
 *
 * Takes the rows rather than fetching them so this file stays free of
 * `server-only` and can be imported anywhere.
 */
export function modelOrganizers(
  partners: readonly { name: string; imageUrl: string; link: string }[],
): { name: string; logo: string; heightClass: string; href?: string }[] {
  return MODEL_ORGANIZERS.flatMap((org) => {
    const match = partners.find((p) =>
      p.name.toLowerCase().includes(org.partner),
    );
    const logo = match?.imageUrl || org.logo;
    if (!logo) return [];
    const href = match?.link || org.href;
    return [
      {
        name: org.name,
        logo,
        heightClass: org.heightClass,
        ...(href ? { href } : {}),
      },
    ];
  });
}
