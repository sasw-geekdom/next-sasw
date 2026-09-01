import { EVENT_DAYS } from "@/lib/event";
import {
  ASSET,
  ROOMS,
  roomSlugFromLegacy,
  type Room,
  type RoomTier,
} from "@/lib/locations";
import type { SessionRow } from "@/lib/admin/cms-types";
import { ACCESS_GREEN } from "@/lib/access-granted";
import { PYSA, PYSA_BLUE } from "@/lib/pysa";
import { MODEL_INK, MODEL_LAVENDER } from "@/lib/the-model";
import type { TrackName } from "@/lib/tracks";

// The confirmed activations, for /schedule. Curated here for now, like ROOMS —
// the sessions CMS can feed this later.
//
// `room` is a ROOMS slug rather than a repeated venue name, so a venue rename
// or reorder can't leave this file quietly wrong. `resolveSessions` drops any
// entry whose room no longer exists instead of rendering a blank venue.
//
// TODO(content): every `blurb` below is a placeholder. Only the titles, venues
// and circuits came from a brief — the descriptions are written from the
// format names alone and need real copy before launch.
//
// TODO(assets): Mission Pitch, Latin Tech Pitch and 1 Million Cups each have a
// lockup that hasn't landed in the repo yet. Save each as white-on-transparent
// at `public/schedule/<slug>.svg` and uncomment its `logo` block — the cards
// already render a logo when one is present and typeset the title when it
// isn't, so nothing else has to change.

export interface FeaturedSession {
  slug: string;
  title: string;
  /** A `Room["slug"]` from lib/locations. */
  room: string;
  /**
   * The part of the room this runs in, when the organisers named one.
   *
   * The banded activations carry this in their own constants files
   * (PYSA.venueDetail, ACCESS_GRANTED.venueDetail); this is the same idea for
   * the type-led heroes. Without it, a brief that says "300 Main — Skylounge +
   * Rooftop Patio" renders as "300 Main" and the reader arrives at a
   * twenty-five-storey building with no floor.
   */
  venueDetail?: string;
  /** The circuit or strand this runs under. Matches the room's session kind. */
  circuit: TrackName | "Social";
  blurb: string;
  /**
   * Optional programme lockup, shown in place of the typeset title.
   *
   * Drop a white-on-transparent SVG (or PNG) into `public/schedule/` and point
   * here; the card falls back to display type when this is absent, so an
   * activation without artwork still renders correctly. Wide lockups suit the
   * slot better than square marks — it's a letterbox, not a badge.
   */
  logo?: { src: string; width: number; height: number; alt: string };
  /**
   * The mark on its own, without the wordmark beside it.
   *
   * A week block is the one surface with height to spare and no room for a
   * wide lockup to use it: `logo` is a letterbox, so it draws across the top
   * and leaves the middle of a two-hour card empty. Given the mark alone, the
   * block can put the name in type where a heading belongs and hand the
   * artwork the middle at a size a reader actually sees it at.
   *
   * Only worth setting where the mark stands up without its words — a
   * pictorial mark, not a wordmark with a symbol tacked on. Stumberg's is two
   * heads and their gears, which is why it is the one activation that has one.
   * Everywhere else, and everywhere but the week block, `logo` is still the
   * mark: an agenda row is 83px with the meta beside it, and a lockup is
   * exactly the right shape for that.
   *
   * No `alt`. It is drawn `aria-hidden` under a title that has already named
   * the activation, so alt text here would say the same thing twice.
   */
  blockArt?: { src: string; width: number; height: number };
  /**
   * Borrow the lockup from a CMS partner instead of a file in the repo, by
   * case-insensitive substring of the partner's name. Use this when the org
   * running the activation is already on the partner wall — the logo then
   * tracks whatever the admin uploads and can't fall out of date here.
   */
  logoFromPartner?: string;
  /**
   * Force the typeset title to wrap before this substring on wide screens,
   * instead of letting it break wherever the cell runs out of room. For titles
   * carrying a trailing attribution ("… powered by X") the natural break lands
   * mid-phrase; this keeps the credit on its own line.
   *
   * Only applies at `lg` and up — a narrow cell already wraps a long title, so
   * forcing the split on mobile just adds a stub line.
   *
   * Visual only — `title` stays a single clean string, since it's also the
   * logo's alt text and the screen-reader heading. Ignored if the substring
   * isn't found, so editing a title can't break the card.
   */
  /**
   * A run inside the title to set in magenta, on the page hero.
   *
   * The calendar draws College Night through `BrandMark`, which knows to put
   * the accent on the second word; the activation page draws the plain title
   * and knew nothing about it, so the same event wore two different marks
   * depending on which page you were on. This is how the page is told.
   *
   * Matched as a substring, and ignored when it is not found — so editing a
   * title can dull the accent but can never break the heading.
   */
  titleAccent?: string;
  /**
   * A short name for lists that can't take the full one — filter chips, the
   * admin's activation picker.
   *
   * "The Creative Futures™ Brunch powered by The Down Market" is 54 characters
   * and carries two brands; as a chip beside "Access Granted" it swamped the
   * row. Omit it and `title` is used, which is right for everything else on
   * the schedule.
   */
  shortTitle?: string;
  /**
   * The name on the share card, where the full title is more than it should
   * carry.
   *
   * Distinct from `shortTitle`, which is cut for a filter chip and an admin
   * picker and goes too far for a 1200x630 card — Google Developer Groups
   * would be reduced to "GDG" there, which is the abbreviation rather than the
   * name. This is the middle setting, and only Trinity has needed it: the
   * competition is formally the Louis H. Stumberg, the page and its heading
   * say so, and the card is the one surface where the benefactor's name costs
   * a whole line of display type to tell a stranger something they did not ask.
   *
   * Falls back to `title`, which is what every other activation uses.
   */
  ogTitle?: string;
  titleBreakBefore?: string;
  /**
   * The same idea for the hero's `h1`, and a separate field because the two
   * want different break points.
   *
   * The bento card is a narrow cell at a modest size, so it breaks before
   * "powered by" and the credit gets a line. The hero is display type at up to
   * 7xl in a `max-w-3xl` column, where that same break leaves a second line too
   * long to hold and it wraps again mid-credit. Sharing one value made one of
   * the two wrong wherever it was set.
   *
   * `lg` and up only. A narrow column already wraps a long title, and forcing
   * the split there just adds a stub line.
   */
  heroBreakBefore?: string;
  /**
   * Long-form content for the activation's own page: the organiser's account
   * of their own morning, in their words.
   *
   * Rendered only when no CMS session points at this activation. The moment an
   * organiser enters the programme properly — with speakers, and rows the
   * speaker pages can link back to — that supersedes this, so the page can
   * never show the same running order twice in two formats. That collision is
   * exactly what took Access Granted's hardcoded columns off its page.
   */
  detail?: {
    /**
     * The section's label, above the headline.
     *
     * Defaults to "The morning", which is what this section said for everyone
     * until there was more than one consumer — it was written for the Creative
     * Futures Brunch, which genuinely is a morning. Give-a-LOT is a drop-off
     * window across three days and a workshop on a fourth, and calling that a
     * morning is simply wrong. Set it when the activation is not a morning.
     */
    eyebrow?: string;
    /**
     * The section's display headline.
     *
     * Required, not optional: every other section on this site runs
     * eyebrow → headline → body, and the first version of this one skipped
     * straight to prose. With no Oswald anchor the block had nothing to hang
     * on, and the lede ended up carrying the weight at 24px — body type doing
     * a display font's job, which is the one place on the site that happens.
     */
    headline: string;
    /**
     * The standfirst, in the pinned intro column.
     *
     * Keep it short — one paragraph, two at the very most. The column has to
     * stay under the viewport height or the pin has nowhere to go, and the
     * headline above it already takes a good share of that. Anything longer
     * belongs in `coda`.
     */
    lede: readonly string[];
    programme?: readonly {
      /** Pre-formatted, because these aren't all instants — "7:30" is a door
       *  time and "8:45 – 9:30" is a slot, and inventing a `when` for each
       *  would put five fake entries into the week's data. */
      time: string;
      /**
       * The recurring format this sits inside, when it has one — "The Fifth
       * Degree Live", "The Down Market Conversation".
       *
       * Separate from `title` because the organisers' second pass gave every
       * slot a session title of its own and kept the show name alongside it.
       * Concatenating the two makes a heading too long to scan; the show name
       * is the smaller fact, so it rides above as a label.
       */
      series?: string;
      title: string;
      body: string;
      /**
       * The draw, pulled out of the prose so it can be read rather than
       * scanned for. Names buried mid-paragraph are names nobody sees.
       */
      people?: readonly {
        name: string;
        role: string;
        /**
         * Their `/speakers` slug, where they have a page.
         *
         * Written down rather than matched on `name`, and the brunch is the
         * reason. It bills one of its two as "Nic McGinnis"; his page is
         * "Nicholas McGinnis". A name match would have linked one of them and
         * silently skipped the other, which is worse than linking neither —
         * nothing would look broken. The billing stays as the organiser wrote
         * it; people go by short forms, and the link is what resolves it.
         *
         * Slugs are safe to hardcode here: a speaker's is stable by design and
         * `previousSlugs` keeps the old one redirecting after a rename.
         */
        speaker?: string;
      }[];
      /**
       * Headline content rather than texture.
       *
       * A running order where doors, an announcement and a DJ set carry the
       * same weight as two conversations with four named guests is a list of
       * five equal things, and reads as flat as that sounds. This marks which
       * ones are actually why someone comes.
       */
      feature?: boolean;
    }[];
    /**
     * A "powered by" wall, for an activation several orgs run together.
     *
     * The same shape `OrganizerLogo` takes, and the same treatment the banded
     * activations give it — a mono label over a row of marks. Bands carry
     * their own wall in their own component; this is how an activation without
     * a band gets one.
     *
     * `heightClass` normalises the marks optically rather than mechanically: a
     * square badge needs more height than a 10:1 wordmark to read as its
     * equal, which is why these are not one number. Same reasoning, and in two
     * cases the same files, as ACCESS_ORGANIZERS and GIVE_A_LOT_ORGANIZERS.
     */
    poweredBy?: readonly {
      name: string;
      logo: string;
      heightClass: string;
      href?: string;
    }[];
    /**
     * Marks to put in front of the reader, where an activation is a room
     * rather than a running order.
     *
     * College Night is a social: nothing is scheduled between the doors
     * opening and closing, so `programme` would be inventing an agenda that
     * does not exist. What it does have is two groups it is built around, and
     * a logo each says that faster than a paragraph does.
     *
     * Rendered in the column `programme` would have used, so the two are
     * alternatives rather than a stack.
     */
    spotlight?: readonly {
      src: string;
      width: number;
      height: number;
      /** Names the mark for anything that cannot draw it. */
      alt: string;
      name: string;
      /** One line on who they are and why they are here. */
      note: string;
      href?: string;
    }[];
    /**
     * The paragraph the section closes on, full width under the programme.
     *
     * Where the "why this matters" goes. It reads better after the running
     * order than before it — the reader has seen what actually happens by
     * then — and it keeps the intro column short enough to pin.
     */
    coda?: string;
    /**
     * Keep this programme even when CMS sessions point at the activation.
     *
     * The default is that CMS rows replace `detail` outright, on the reasoning
     * that a row is strictly richer: it carries speakers, it links back from
     * their pages, and an organiser can change it without a deploy. That holds
     * right up until the prose is the fuller account.
     *
     * The Creative Futures Brunch is that case. Its programme is a four-hour
     * morning in five acts — doors and espresso, two live conversations, a
     * reveal, a closing set — with series names, running order and a narrative
     * the organisers wrote. One CMS row was entered for the headline
     * conversation and the whole morning vanished behind it: no Pulp Coffee,
     * no Wake-Up, no second conversation, no Coffeehouse Set, on a page whose
     * own blurb promises "two live conversations".
     *
     * Deleting the row is not the fix. It is what puts that conversation on
     * Dirk Elmendorf's and Nicholas McGinnis's speaker pages, and those read
     * sessions directly rather than through this page. So the row stays and
     * does its job there; this says the activation page keeps its own account.
     *
     * Set it only where the prose genuinely is the fuller programme. An
     * activation that gains a real CMS running order should lose this rather
     * than carry two.
     */
    ownProgramme?: boolean;
    /** The line the morning closes on. */
    kicker?: string;
    /** How to get in, when that isn't simply "register". */
    access?: string;
  };

  /**
   * Gives this session its own page at `/schedule/<page>`, for an activation
   * big enough to be a mini-conference inside the week rather than a card in
   * someone else's room.
   *
   * Separate from `slug` on purpose. `slug` names the edition — the 2026 run
   * is `pysanantonio-ii` — while the URL should outlive it, so next year's
   * third edition keeps the same address and whatever links to it. Omit this
   * and the session simply has no page.
   */
  page?: string;
  /**
   * The organiser's own page for this activation, when it has one.
   *
   * These are partner-run events with their own sites, schedules and
   * applications. This site holds where it sits in the week; the depth lives
   * there, and its page should say so rather than pretend otherwise.
   */
  site?: {
    label: string;
    /**
     * Omitted when we run the thing ourselves — Startup Bash is ours, so the
     * credit is a statement of fact with nowhere else to send anyone. The
     * page renders it as plain text rather than a link back to this same
     * site, which would be a dead loop dressed as a handoff.
     */
    href?: string;
  };
  /**
   * Where this activation is actually entered, when it is not the week's own
   * list.
   *
   * Every page here offers "Get on the list." pointing at `/register`, on the
   * premise the whole site is built around: one free registration covers the
   * week, and every room honours it. That premise holds for the five downtown
   * rooms and breaks at Trinity, whose venture competition is a Trinity event
   * the week is a guest at. It has its own free ticket on Eventbrite, and a
   * Startup + Tech Week badge does not open that door.
   *
   * So the CTA is overridable rather than absolute. Left unset — which is
   * every other activation — the button stays exactly as it was.
   *
   * Rendered as an external link, because that is the only reason to set it.
   * `label` replaces the button's own words too: "Get on the list." names the
   * week's list specifically, and it would be the wrong promise on a button
   * that leaves the site.
   */
  register?: { label: string; href: string };
  /**
   * Confirmed start and end, once the organiser has fixed them.
   *
   * ISO 8601 with an explicit offset, not display strings: the page label, the
   * metadata description and the downloadable calendar file all derive from
   * this one value, so they cannot drift apart. Absent means genuinely
   * unconfirmed — the page says so rather than inventing a placeholder.
   *
   * The week runs in America/Chicago and ends well before DST does (Nov 1
   * 2026), so every 2026 session is -05:00.
   */
  when?: { start: string; end: string };
  /**
   * A multi-day window for an activation that genuinely has no hour.
   *
   * Give-a-LOT's drop-off runs across three days; it is not a two-hour slot
   * that nobody has pinned down yet, so `when` would be the wrong shape and
   * inventing a start time would put a fake fact on the grid. Inclusive on
   * both ends, `YYYY-MM-DD`, in the week's own timezone.
   *
   * The calendar renders these on the all-day rail above the hour axis —
   * where a calendar puts an event that spans days — rather than dropping
   * them, which is what `scheduleByDay` does and why Give-a-LOT was invisible
   * on the strip.
   *
   * Mutually exclusive with `when` in practice. If an activation ever has
   * both — a week-long window plus one headline hour — `when` wins on the
   * grid and this is ignored, because an event drawn twice reads as two.
   */
  span?: { from: string; to: string };
  /**
   * A photograph for the page's hero, laid into the right of the frame behind
   * the copy — not a card image and not shown anywhere else.
   *
   * Desktop only by the time it renders: below `lg` the hero is a single
   * column and a photograph under the type would fight it. Pick something
   * that reads at a glance and survives being masked and dimmed, because it
   * is set into the black rather than placed on top of it.
   */
  hero?: { src: string; width: number; height: number; alt: string };
}

/** The one activation big enough to carry the page on its own. */
export const HEADLINE_SESSION: FeaturedSession = {
  slug: "pysanantonio-ii",
  page: "pysanantonio",
  title: "PySanAntonio II",
  room: "the-rand",
  circuit: "Tech & Builders",
  // Friday, October 2, 1:00–6:00 PM — the same slot lib/pysa states in prose
  // for the band, expressed here in the shape every activation uses.
  when: {
    start: "2026-10-02T13:00:00-05:00",
    end: "2026-10-02T18:00:00-05:00",
  },
  // The wordmark, not the typeset title — this is the one activation with its
  // own brand, and the band on /schedule already leads with the mark.
  //
  // `wordmark-dark` is the right one of the pair: it draws in PySA's lighter
  // blue (#4a90d9) for dark grounds, where plain `wordmark.svg` uses #0059b7
  // and would sink into the card. Dimensions come from lib/pysa so the band
  // and the card can't disagree about the same file.
  logo: {
    src: PYSA.wordmark,
    width: PYSA.wordmarkWidth,
    height: PYSA.wordmarkHeight,
    alt: PYSA.name,
  },
  blurb:
    "The city's Python conference, back for a second run — talks, workshops, and the people who build with it every day.",
};

/**
 * The second activation with a band of its own.
 *
 * Kept out of FEATURED_SESSIONS for the same reason PySanAntonio is: the bento
 * renders that array, and a banded activation appearing again as a card three
 * sections lower reads as the schedule repeating itself.
 */
export const ACCESS_GRANTED_SESSION: FeaturedSession = {
  slug: "access-granted",
  page: "access-granted",
  title: "Access Granted",
  room: "the-rand",
  circuit: "Tech & Builders",
  when: {
    start: "2026-09-30T13:00:00-05:00",
    end: "2026-09-30T18:00:00-05:00",
  },
  blurb:
    "Every other room this week is people talking about technology. This one is people taking it apart — lockpicking, threat modeling, and zero-pitch technical talks.",
};

/**
 * The third, and the reason the schedule intro now says three takeovers.
 *
 * Out of FEATURED_SESSIONS for the same reason as the other two: the bento
 * renders that array, and a banded activation appearing again as a card a
 * section lower reads as the schedule repeating itself.
 *
 * TODO(content): the venue is the one field here that didn't come from the
 * brief. The Rand is where the other two DEVSA-convened activations run and is
 * the community floor DEVSA hosts, so it is the reasoned answer rather than a
 * confirmed one — and it drives the .ics location, the Event markup and the
 * "Everything else at" link. Worth confirming with the organisers.
 */
export const THE_MODEL_SESSION: FeaturedSession = {
  slug: "the-model",
  page: "the-model",
  title: "The Model",
  room: "the-rand",
  venueDetail: "3rd Floor",
  // Generative media and production tooling, not a security or a Python room —
  // the same circuit 300 Main's creative morning sits on.
  circuit: "AI & Applied Innovation",
  when: {
    start: "2026-09-28T13:00:00-05:00",
    end: "2026-09-28T18:00:00-05:00",
  },
  // The brief's core hook, tightened to card length. What survives is what the
  // hook has that the tagline doesn't: the three things being put in one room,
  // and that the talks come from people who actually ship with these tools.
  //
  // Event voice, not product voice. Earlier passes borrowed sentence shapes
  // from elevenlabs.io/creative and runway.com — "turn ideas into finished
  // image, film and voice" — which is a capability promise. Those sites sell a
  // tool; this is an invitation to a room, and it cannot promise a reader an
  // outcome. So this names the two communities, the occasion, and what happens
  // in it, in that order.
  //
  // 150 characters against Access Granted's 161, close enough to sit level
  // beside it on /schedule/the-rand, where this once ran to five lines against
  // that one's four and made the pair look like an accident. Treat that as the
  // ceiling for any rewrite.
  //
  // It closed on "local makers breaking down how the work actually gets made"
  // until the programme was set. The afternoon is a thirty-minute keynote on
  // what is coming, then talks on virtual reality, audio, Claude, and image and
  // video models — so the old line described the format accurately and the
  // subject backwards. "What comes next" is the day; "already building it" is
  // the part of the brief's hook worth keeping, that the talks come from people
  // who actually ship rather than from a panel.
  //
  // The lineup itself is deliberately not listed here. It belongs to the
  // sessions CMS, which renders it on the page, and a blurb that named five
  // topics would be 182 characters and out of step with the card beside it.
  blurb:
    "An afternoon that puts San Antonio's creative economy and the DEVSA community in one room — what comes next, and the local makers already building it.",
};

export const FEATURED_SESSIONS: FeaturedSession[] = [
  {
    slug: "mission-pitch",
    page: "mission-pitch",
    site: { label: "missionpitch.org", href: "https://www.missionpitch.org/" },
    // White-on-transparent, so it sits on the dark card and the dark page
    // without a plate behind it. Copied into the repo rather than hotlinked
    // from the bucket it arrived in: next/image needs the host in
    // `remotePatterns`, and a mark the layout depends on shouldn't hang off a
    // third party.
    //
    // Cropped to its ink before committing. As supplied it was 1200x400 with
    // 157px of transparent margin down the left, so `object-left` aligned the
    // file's edge while the visible mark sat indented from the eyebrow above
    // it. Trimmed, the box and the mark are the same thing and CSS controls
    // the spacing. Any future lockup wants the same treatment.
    logo: {
      src: "/activations/mission-pitch.png",
      width: 920,
      height: 225,
      alt: "Mission Pitch",
    },
    title: "Mission Pitch",
    room: "tpr",
    circuit: "Capital",
    // The 2025 showcase — a $20,000 grant handed over on the night, which is
    // the blurb's "grants decided in the room" as a photograph. Resized from
    // the 2500px original on missionpitch.org; anything larger is bytes that
    // never reach a screen.
    hero: {
      src: "/activations/mission-pitch-hero.jpg",
      width: 1800,
      height: 1200,
      alt: "",
    },
    // Moved an hour later. The organisers' Luma listing has it 6–8pm, against
    // the 5–7 this held from the first brief, and that page is the one taking
    // registrations so it is the one that decides. Still the only thing
    // running at Texas Public Radio that evening.
    when: {
      start: "2026-09-28T18:00:00-05:00",
      end: "2026-09-28T20:00:00-05:00",
    },
    // Seats are held on MissionPitch's own page, not ours — see `register`.
    // The second activation to need it after Trinity, and for a softer
    // reason: this one is on our main stage and a badge plausibly does get
    // you in, but the organisers are counting a room and the count happens
    // there. Sending people to the week's list would leave them uncounted.
    register: {
      label: "Save a seat.",
      href: "https://luma.com/lb8n7frf",
    },
    // Nonprofit leaders, not founders. missionpitch.org describes it as "an
    // accelerator for nonprofit leaders in the greater San Antonio area", run
    // by Social Venture Partners with Geekdom. The old blurb said "founders"
    // and "capital", which described a startup demo day this isn't.
    //
    // "Grants decided in the room" went with the 2026 listing. That was the
    // 2025 shape, where the cohort took $72,855 and part of it was raised on
    // the night; this year's copy asks the room to donate live rather than
    // describing a decision, and the money is not the whole of what is being
    // asked for either — "funding and support" is theirs, and the support is
    // board seats and volunteers.
    blurb:
      "Five San Antonio nonprofits pitch from the main stage \u2014 and the room funds them on the night.",
    detail: {
      eyebrow: "The evening",
      headline: "Five nonprofits pitch. The room funds them.",
      lede: [
        "MissionPitch is an accelerator for nonprofit leaders across greater San Antonio \u2014 Social Venture Partners San Antonio and Geekdom running the startup world\u2019s playbook for organisations that are not startups. This is the night it ends.",
        "Five take the stage: ABODE Contemplative Care for the Dying, Bexar Branches Alliance, For Her, the San Antonio Book Festival and Black Outside, Inc. They pitch their work to the room, and the room donates live.",
      ],
      coda: "More than a pitch competition, in their own framing: a bridge. Unrestricted funding on one side, a room of people who can give time and expertise on the other, and a few weeks of coaching to make the ask land. Powered by the San Antonio Area Foundation, with Kronkosky and the H.E. Butt Foundation.",
      // Their line, verbatim, and the sharpest thing on the page — it says
      // what an organisation actually leaves with, which is not only money.
      kicker:
        "One pitch on our stage can be the catalyst that secures a new board member, a dedicated volunteer, or the funding needed to reach the next milestone.",
      access:
        "Free, and seated through MissionPitch\u2019s own registration rather than the week\u2019s \u2014 their page is the one holding the count.",
    },
  },
  {
    slug: "latin-tech-pitch",
    page: "latin-tech-pitch",
    site: {
      label: "latintechpitch.com",
      href: "https://www.latintechpitch.com/about-1",
    },
    title: "Latin Tech Pitch",
    room: "tpr",
    circuit: "Capital",
    // Per latintechpitch.com: "an elite startup competition for early-stage,
    // Latino-led tech companies", eligibility Texas-wide rather than local
    // (the old "building here" implied San Antonio), presented in partnership
    // with the Consulate General of Israel. "$110k in prizes and mentorship"
    // mirrors their own framing — the cash placings total far less, so it
    // shouldn't be described as a purse.
    blurb:
      "Latino-led startups from across Texas, pitching for $110k in prizes and mentorship — presented with the Consulate General of Israel.",
    when: {
      start: "2026-09-30T14:00:00-05:00",
      end: "2026-09-30T18:00:00-05:00",
    },
    // The mark reads "LatinTECH PITCH 2026" — the only version they publish
    // that carries the full name; the plain "LatinTECH" wordmark drops
    // "Pitch". The year is baked into the artwork, so this file needs a new
    // one if the page outlives the 2026 edition.
    logo: {
      src: "/activations/latin-tech-pitch.png",
      width: 936,
      height: 243,
      alt: "Latin Tech Pitch",
    },
    // The 2024 competition's room, from latintechpitch.com. Chosen over their
    // cheque-presentation shots on purpose: Mission Pitch already leads with
    // one, and two sibling pages running the same composition reads as a
    // template. A full house also survives the hero's mask — whatever the
    // dissolve eats is still a crowd, where a single subject would be lost.
    hero: {
      src: "/activations/latin-tech-pitch-hero.jpg",
      width: 1800,
      height: 1200,
      alt: "",
    },
  },
  {
    slug: "1-million-cups",
    page: "1-million-cups",
    // The chapter is run by Launch SA, who host it at their Central Library
    // HQ — so the "run by" credit points at them rather than at 1MC's national
    // site. 1millioncups.com/sanantonio still redirects to the chapter page if
    // that's ever wanted back.
    site: {
      label: "launchsa.org",
      href: "https://launchsa.org/",
    },
    title: "1 Million Cups",
    room: "central-library",
    circuit: "Small Business & Solopreneur",
    blurb:
      "The weekly founder format, run at Launch SA HQ: present, take questions, leave with answers.",
    when: {
      start: "2026-09-30T09:00:00-05:00",
      end: "2026-09-30T11:00:00-05:00",
    },
    // 1millioncups.com's stacked white mark, which already carries the
    // Kauffman Foundation line — their other lockup is white knocked out of an
    // orange square, and a square of brand colour would fight the black.
    // Stacked, so it sits taller and narrower than the wide lockups on the
    // other cards; the slot is height-led, which keeps them on one baseline.
    logo: {
      src: "/activations/1-million-cups.png",
      width: 1072,
      height: 536,
      alt: "1 Million Cups",
    },
    // From launchsa.org, and shot at an actual 1 Million Cups morning there —
    // the venue's own branding is on the glass, which is worth more than a
    // generic room given the blurb names Launch SA HQ. Deliberately quieter
    // than the other two: a cheque handover and a full auditorium already
    // carry the week's big moments, and this one is a weekly working session.
    hero: {
      src: "/activations/1-million-cups-hero.jpg",
      width: 1800,
      height: 1200,
      alt: "",
    },
  },
  {
    slug: "the-creative-futures-brunch",
    page: "the-creative-futures-brunch",
    title: "The Creative Futures™ Brunch powered by The Down Market",
    titleBreakBefore: "powered by",
    // Keeps the partner's name whole on one line, and pulls the trailing "the"
    // off the end of the line above — at hero size that word ran out over the
    // photograph and landed on the left speaker's face.
    heroBreakBefore: "The Down Market",
    // The name locations.ts already prints in room-flow, so the two agree.
    shortTitle: "The Creative Futures Brunch",
    room: "300-main",
    venueDetail: "Skylounge + Rooftop Patio",
    circuit: "AI & Applied Innovation",
    // Condensed from the organisers' own "short version", which runs ~640
    // characters — every other card on /schedule is 86–161, and dropping
    // theirs in whole made this one cell four times the height of the rest
    // and broke the grid. What survives is what their version has that the
    // previous copy didn't: the floor, the DJ, both conversations by name,
    // and the fact that it costs nothing extra. The rest is on the page.
    blurb:
      "Espresso, brunch and DJ Novasoul on the 25th floor, plus two live conversations with the people building here. Included with your registration.",
    // Doors 7:30. The organisers' first brief said "programme through 11:00",
    // but their revised running order ends the coffeehouse set at 11:30 — so
    // the event runs to 11:30 here. Leaving 11:00 would have put a hero that
    // says the morning ends at 11:00 directly above a programme row that runs
    // to 11:30, and shipped an .ics that clears an attendee's calendar while
    // the DJ is still playing. Worth confirming with them.
    when: {
      start: "2026-10-01T07:30:00-05:00",
      end: "2026-10-01T11:30:00-05:00",
    },

    site: {
      label: "thecreativefutures.com",
      href: "https://www.thecreativefutures.com/",
    },
    // The organisers' own account of their morning, lightly edited in one
    // respect only: they write "San Antonio Startup Week" and "SASW", and this
    // site cannot refer to itself by a name it doesn't use anywhere else, so
    // those read "Startup + Tech Week" here.
    detail: {
      // The morning below is the real running order; a CMS row for one of its
      // conversations must not replace it. See `ownProgramme`.
      ownProgramme: true,
      // Their closing line, promoted to lead the section, and cut from three
      // sentences to two.
      //
      // It replaced "Coffee first. Conversations second.", which ranked the
      // morning's two halves against each other and put the talks in the
      // lesser slot — with four named guests on the rail below, the headline
      // would have been arguing with its own section.
      //
      // "Stay for the conversations" came out because the full line ran five
      // lines of Oswald in a 384px column, and that middle beat is the one the
      // page already demonstrates: nearly everything under this headline is a
      // conversation. What's left is the arc and the payoff.
      headline: "Come for the coffee. Leave with something to build.",
      lede: [
        "Start Startup + Tech Week twenty-five floors up, espresso pulled fresh, brunch on the table, a DJ easing the morning open, and downtown San Antonio stretched out below.",
      ],
      programme: [
        {
          time: "7:30",
          title: "The Wake-Up \u2014 coffee, sound, skyline",
          body: "Doors. Pulp Coffee\u2019s mobile espresso experience, brunch service, and DJ Novasoul setting the tone inside and out on the rooftop.",
        },
        {
          time: "8:45 \u2013 9:30",
          series: "The Fifth Degree Live",
          title: "The Collision: AI, Design, and What Gets Built Next",
          feature: true,
          // Full positioning as the organisers wrote it. An earlier pass cut
          // these to "Co-founder, Rackspace" and "Family office advisor",
          // which reads as a founder and a money person — it drops that both
          // of them are hands-on in product design and AI, which is the whole
          // reason this pairing makes sense on an AI & Applied Innovation
          // morning.
          people: [
            {
              name: "Dirk Elmendorf",
              role: "Co-founder, Rackspace · Product design · Engineering · Data + AI",
              speaker: "dirk-elmendorf",
            },
            {
              name: "Nic McGinnis",
              role: "Family office advisor · Product design + Data + AI",
              speaker: "nicholas-mcginnis",
            },
          ],
          body: "Will and Nate of The Fifth Degree podcast host a conversation at the intersection of AI, product design and engineering \u2014 and what it takes to build what comes next.",
        },
        {
          time: "9:45 \u2013 10:30",
          series: "The Down Market Conversation",
          title: "Keep the Doors Open: Tech for the Places Culture Lives",
          feature: true,
          people: [
            { name: "Daniel Trevino", role: "Box Street Social \u00b7 Maitre" },
            { name: "Ben Hodge", role: "EEVET" },
          ],
          body: "Madison King talks with two builders solving real problems for real places \u2014 Maitre, built to help restaurants open smarter and last longer, and EEVET, built to help venues, artists and promoters book better. Different rooms, same mission: giving creative businesses the information they\u2019ve always deserved.",
        },
        {
          time: "10:30",
          title: "The Reveal",
          body: "From The Creative Futures, before the morning closes. You\u2019ll want to be in the room for this one.",
        },
        {
          time: "10:35 \u2013 11:30",
          title: "The Coffeehouse Set",
          body: "DJ Novasoul takes it home. Stay, refill, meet the person next to you. That\u2019s the point.",
        },
      ],
      // Moved out of the intro. It's the argument rather than the invitation,
      // and it lands harder once the reader has seen the actual morning —
      // "some of the people building it live here" means more directly under
      // four names than three screens above them.
      coda: "The Creative Futures Brunch has been bringing this city\u2019s creative and tech communities to the same table since 2019. This year it opens Thursday morning with a simple idea: creativity and technology aren\u2019t two different industries. They\u2019re one economy \u2014 and some of the people building it live here.",
      // The one operational thing a reader could get wrong: there is no
      // separate RSVP, and looking for one is how someone talks themselves
      // out of turning up.
      // The third beat of their "Coffee first. Conversations second. Community
      // all morning." Only the first two were ever in play — one became the
      // headline, one came out — and this one had fallen off the page
      // entirely. It's the beat that says the value isn't only the
      // programming, which the 10:35 entry demonstrates and nothing states.
      // Last line in the section, in display type, after the coda.
      kicker: "Community all morning.",
      access:
        "No separate RSVP. Access is included with your Startup + Tech Week registration \u2014 register, then check in with your badge to join us on the 25th floor at 300 Main, Skylounge and rooftop patio.",
    },
    // No logo: the title already carries both brands in full — "The Creative
    // Futures ™ Brunch powered by The Down Market" — so a mark would be the
    // third time the page says who is behind it.
    //
    // Dirk and Nic, who headline the 8:45 conversation, from the organisers'
    // own KLPZ set. Chosen over the other frame, a wide room shot in which
    // both of them are small and most of the picture is the backs of heads.
    //
    // Cropped near-portrait (0.93) rather than left as the landscape original,
    // to match the hero container's own ratio at laptop widths so object-cover
    // takes nothing off the sides — a landscape crop lost the left man
    // entirely there.
    //
    // He still dissolves on a very wide monitor. Past 2xl the picture reaches
    // further left and the mask fades across 44% of it, and there simply isn't
    // enough room to the left of these two in the source to push both clear of
    // that. A tighter crop was tried and made it worse: it zoomed far enough
    // in to cut his face at laptop width, which is where most people read
    // this. This is the better side of that trade, not a free choice.
    hero: {
      src: "/activations/creative-futures-crew.jpg",
      width: 1500,
      height: 1079,
      alt: "",
    },
  },
  {
    slug: "startup-bash",
    page: "startup-bash",
    title: "Startup Bash",
    room: "legacy-park",
    circuit: "Social",
    blurb:
      "Where the week unwinds. Open-air, the whole ecosystem in one place, no badge scanning.",
    when: {
      start: "2026-10-01T18:00:00-05:00",
      end: "2026-10-01T20:00:00-05:00",
    },
    // Ours, so there is no organiser to hand off to — see `site.href`.
    site: { label: "Startup + Tech Week" },
    // No logo on purpose: this one is the week's own party, not a partner
    // brand, so the title is typeset like any other heading.
    //
    // The art is Legacy Park's own magenta ASCII illustration, already in the
    // asset bucket the venue images come from. It is near-black at 20/255, so
    // unlike the photographs it never threatens the copy — the mask is doing
    // composition here, not rescue.
    hero: {
      src: ASSET("sastw-legacypark.jpg"),
      width: 784,
      height: 720,
      alt: "",
    },
  },

  /**
   * The week's community-service activation, and the only one that asks the
   * reader to bring something rather than to turn up.
   *
   * Two events under one name: a drop-off window across the first half of the
   * week, and a workshop and giveaway on the Friday. Filed under the Friday
   * because that is the part with a room and a time — but `driveLabel` in
   * lib/give-a-lot.ts leads the band's metadata row, because the drop-off is
   * the part that needs a reader to act, and it starts first.
   *
   * No `when`, deliberately. The organisers have fixed the day and said the
   * drop-off point and the times follow closer to the week, so there is no
   * confirmed start and end to publish. That costs the Event rich result and
   * the .ics download, which is the correct trade: both would be marking up a
   * guess, and this file's own rule is that absent means genuinely
   * unconfirmed. Add `when` the moment the organisers name an hour and both
   * come back with no other change.
   */
  {
    slug: "give-a-lot",
    page: "give-a-lot",
    title: "Give-a-LOT Computer Donation Drive",
    // "Give-a-LOT Computer Donation Drive" is 34 characters and carries a
    // pun that needs its object; as a filter chip beside "Access Granted" the
    // full name swamps the row and the wordmark alone is what people say.
    shortTitle: "Give-a-LOT",
    room: "central-library",
    venueDetail: "1st Floor",
    // Sept 28 – 30, from the drop-off row in `detail.programme` below. Stated
    // here as data so the calendar's all-day rail can span it; the programme
    // row stays the prose version of the same three days.
    span: { from: "2026-09-28", to: "2026-09-30" },
    // Linux and open source software, taught and installed. The room's other
    // two sessions are Small Business & Solopreneur, but a room is not a
    // circuit — The Rand carries three between its three activations.
    circuit: "Tech & Builders",
    logo: {
      src: "/give-a-lot/lockup.svg",
      width: 630,
      height: 230,
      alt: "Give-a-LOT Computer Donation Giveaway",
    },
    blurb:
      "DEVSA and learnOPENtech turn donated hardware into fast, private Linux machines, then hand them to students, families and non-profits who need one.",
    detail: {
      eyebrow: "The drive",
      headline: "Nothing here is junk.",
      lede: [
        "A working computer stops being supported on the day its vendor decides it does. That is a business decision, not a technical one \u2014 the hardware is usually fine, and most of it ends up as e-waste anyway.",
        "DEVSA and learnOPENtech spend the week collecting those machines, rebuilding them on Linux and open source software, and putting them back into the community.",
      ],
      programme: [
        {
          time: "Sept 28 \u2013 30",
          title: "Curbside drop-off",
          body: "Bring working laptops, desktops or components to the collection point. The exact location and hours are announced closer to the week. Nothing needs to be wiped first \u2014 drives are erased as part of the rebuild.",
        },
        {
          time: "Friday, Oct 2",
          title: "Intro to Linux & Open Source Software",
          body: "A hands-on session at Launch SA on what open source actually is, how a machine gets rebuilt on it, and why a computer written off by its manufacturer is usually the fastest one somebody in the room has owned.",
          feature: true,
        },
        {
          time: "Friday, Oct 2",
          title: "Community computer giveaway",
          body: "The machines collected across the week go home with students, families and non-profits, set up and ready to use.",
          feature: true,
        },
      ],
      coda: "Vendor lock-in is the reason a five-year-old laptop feels slow, and open source is the reason it does not have to. Every machine that leaves this room is one that was headed for a landfill and is now somebody's first computer, running software nobody can switch off remotely.",
      kicker: "Bring a machine. Take one home. Both count.",
      access:
        "Free with Startup + Tech Week registration. Donations are welcome from anyone, whether or not you are attending the week.",
    },
  },

  // ─── The Rand, Tuesday ────────────────────────────────────────────────────
  //
  // The community floor's first stacked day: three groups that already run all
  // year, an hour each, back to back. They are separate activations rather than
  // one "community afternoon" block because they are separate organisations
  // with their own members, their own sites and their own speakers — collapsing
  // them into one card would credit none of them and give the CMS nothing to
  // attach a speaker to.
  //
  // Three is also exactly EXPAND_MAX, so the week still draws them individually
  // rather than folding the run into a summary block. A fourth group on this
  // afternoon tips that over, which is the intended behaviour and worth knowing
  // before one is added.
  //
  // TODO(content): AITX and the .NET user group are each bringing a speaker who
  // hasn't been named yet. Those belong in the sessions CMS pointed at these
  // slugs — not here — which is what makes the speaker pages link back. Google
  // Developer Groups already has one: Hastimal Jangid is in the CMS and needs a
  // session row with `activation: "google-developer-groups"`.
  {
    slug: "aitx",
    page: "aitx",
    title: "AITX Community",
    room: "the-rand",
    venueDetail: "3rd Floor",
    circuit: "AI & Applied Innovation",
    site: {
      label: "aitxcommunity.com",
      href: "https://www.aitxcommunity.com/",
    },
    // Their own mark, redrawn for a dark ground. AITX publishes no vector and
    // no light-on-dark cut, so this is traced from their artwork.
    //
    // Two things had to be solved. Their wordmark is pure black, so on a dark
    // card the type vanished and left a floating orange figure; and the first
    // fix — swapping every achromatic pixel to white, the standard dark-mode
    // treatment — was wrong, because the orange figure's antialiased edge is
    // *also* nearly neutral, so the rule outlined the whole mark in a white
    // fringe. Invisible at card size, obvious at hero size.
    //
    // Traced instead, from the largest artwork they publish. Their site ships
    // a 480x136 PNG whose wordmark is only 228px wide, and at that resolution
    // a trace ripples: the bowl of the "a" scallops and the dot on the "i" —
    // 14px across — comes out a visible polygon however the tracer is tuned.
    // The newsletter's own logo files are 1200px, and the square one carries
    // the same drawing (measured: 0.99 IoU against the horizontal lockup's
    // figure, 0.97 against its wordmark) with the wordmark at 755px, 3.3x the
    // resolution. So the shapes come from there and the horizontal geometry —
    // wordmark 1.3696x the figure's width, gap 0.4587x, centres aligned —
    // comes from the landscape lockup, measured off it rather than guessed.
    //
    // The orange is #FF4200, taken from the landscape file and matching their
    // site. The square file fills the same figure #FF6600; the shape is what
    // was borrowed from it, not the colour.
    //
    // TODO(assets): an official vector from AITX would still beat a trace.
    logo: {
      src: "/activations/aitx.svg",
      width: 4703,
      height: 1277,
      alt: "AITX Community",
    },
    // One of their own rooms, from aitxcommunity.com — a speaker with a mic
    // and a room listening, which is what a one-hour community activation
    // actually looks like.
    //
    // Chosen over their wider hackathon group photo for how it meets the
    // frame. This hero is masked into black behind the copy, and the group
    // shot is bright edge to edge, so the mask handed off at a visible seam.
    // This room is dark and dissolves into it, and its one lit subject is
    // still legible after the dimming. The cost is honest: it says "a room",
    // not "seven thousand members", which is what the blurb beside it claims.
    //
    // 4:3, so it crops harder into the letterbox than their one true landscape
    // would; the speaker sits near the right edge and goes further into the
    // corner as the viewport widens.
    hero: {
      src: "/activations/aitx-hero.jpg",
      width: 1800,
      height: 1350,
      alt: "",
    },
    when: {
      start: "2026-09-29T15:00:00-05:00",
      end: "2026-09-29T16:00:00-05:00",
    },
    // Their stated mission is "to make Texas the best place in the world to
    // hire technical talent and build technical companies", and the meetups
    // run in Austin and Houston — San Antonio is not on that list, which is
    // the actual news here and what the blurb leads on.
    blurb:
      "Seven thousand engineers, AI founders and researchers building the Texas AI ecosystem — a group that meets in Austin and Houston, on a San Antonio floor for the week.",
    detail: {
      eyebrow: "The hour",
      headline: "The Texas triangle, one floor up.",
      lede: [
        "AITX runs the technical AI community across the Texas triangle \u2014 monthly meetups, hackathons and dinners for the engineers, founders and researchers building on frontier tooling rather than talking about it.",
        "Their rooms are in Austin and Houston. This hour is the first of them in San Antonio, on the floor DEVSA keeps for exactly this.",
      ],
      coda: "Texas keeps being described as an AI hub in the aggregate \u2014 the capital that landed, the companies that moved. AITX is the part of that which is a room with people in it, and the difference between a region with startups and a region with an ecosystem is whether those people ever meet.",
    },
  },
  {
    slug: "google-developer-groups",
    page: "google-developer-groups",
    title: "Google Developer Groups",
    // "Google Developer Groups" is 23 characters and reads as a sentence in a
    // filter chip beside "AITX". GDG is what the chapter calls itself anyway.
    shortTitle: "GDG",
    room: "the-rand",
    venueDetail: "3rd Floor",
    circuit: "Tech & Builders",
    // The San Antonio chapter, not the global directory. There is a real
    // chapter page — 343 members, its own organisers and its own events — and
    // sending a reader to Google's worldwide chapter index to find out about
    // the local one is the same mistake as pointing the .NET group at
    // dotnet.microsoft.com.
    site: {
      label: "gdg.community.dev/gdg-san-antonio",
      href: "https://gdg.community.dev/gdg-san-antonio/",
    },
    // The one-line lockup in its light-on-dark cut — white type with Google's
    // four brand colours in the mark, straight from the GDG platform. Nothing
    // recoloured here; this variant is published.
    logo: {
      src: "/activations/google-developer-groups.svg",
      width: 3003,
      height: 300,
      alt: "Google Developer Groups",
    },
    when: {
      start: "2026-09-29T14:00:00-05:00",
      end: "2026-09-29T15:00:00-05:00",
    },
    // What the group does, and nothing about who is speaking.
    //
    // It used to name the speaker — "a featured talk from Hastimal Jangid" —
    // which was the right call when the hero was all this page had. It is not
    // now: the talk card sits immediately to the right with his name, his
    // role, his photograph and the whole abstract, so the blurb was
    // introducing someone the reader could already see. The card carries the
    // talk; this carries the room.
    //
    // Most of this is theirs, from the chapter page rather than the GDG
    // programme: independently run — their own disclaimer is that the group's
    // activities should not be linked to Google the corporation — and a recent
    // calendar that is Build Nights and jams rather than talks, March, April,
    // a Juneteenth Civic Build Jam in June. Leading on that rather than on
    // "developer community" is what makes this the chapter and not the
    // directory entry.
    //
    // AI Studio is the exception and comes from an organiser rather than the
    // page, so it will not be found by checking the source the rest came from.
    // It replaced "on a keyboard", which was true of any build night anywhere;
    // naming the tool is the difference between a group that meets and a group
    // that meets to do something specific.
    //
    // The member count went. It was the most quotable fact on the chapter page
    // and the least useful one here — a number that dates itself, on a line
    // that has to say what the room is for.
    blurb:
      "The San Antonio chapter of Google Developer Groups: independently run, and a year of build nights where the learning happens in AI Studio.",
    detail: {
      eyebrow: "The hour",
      headline: "Local chapter, open door.",
      lede: [
        "Google Developer Groups are local communities where developers build skills together, in person and online \u2014 open to anyone interested in the technology, at any level of experience.",
        "The chapter brings its featured speaker to The Rand for the hour: Hastimal Jangid, co-founder of RankRabbit AI, on cloud, data and AI engineering at platform scale.",
      ],
      coda: "A chapter is not a conference track. It is the same people, in the same city, month after month \u2014 which is why the useful thing this hour offers is not the talk but the group still being there in November.",
    },
  },
  {
    slug: "college-night",
    page: "college-night",
    title: "College Night",
    titleAccent: "Night",
    room: "the-rand",
    venueDetail: "3rd Floor",
    // Social, not Tech & Builders. Nothing is programmed between the doors
    // opening and closing — the point is the room, and the week already has a
    // circuit for that.
    circuit: "Social",
    when: {
      start: "2026-09-29T16:00:00-05:00",
      end: "2026-09-29T18:00:00-05:00",
    },
    blurb:
      "Every computing student in San Antonio, community college and university alike — two hours on Geekdom's third floor with the DEVSA community, and the RowdyHacks team asking for hands before Saturday.",
    detail: {
      eyebrow: "The night",
      headline: "Bring the whole cohort.",
      lede: [
        "Computer science, AI, cybersecurity, data engineering, electrical engineering \u2014 if you are studying any of it anywhere in San Antonio, this is the room. The Alamo Colleges, UTSA, St. Mary's, Trinity, Texas A&M-San Antonio, UIW. There is no home campus for this one, and no one is checking which logo is on your student ID.",
        "The fall semester is still young, which is the point: clubs are recruiting, teams are forming, and nobody has picked their year yet. DEVSA describes itself as the bridge across San Antonio's tech ecosystem, and is careful about how \u2014 it does not replace the communities doing the work, it hosts them and connects them. There are more than twenty of those groups behind this one room.",
      ],
      spotlight: [
        {
          src: "/activations/acm-utsa.webp",
          width: 320,
          height: 320,
          alt: "ACM UTSA",
          name: "ACM UTSA",
          note: "UTSA's Association for Computing Machinery chapter, and the six groups under it \u2014 ACM-W, Coding in Color, the ICPC team and more.",
          href: "https://acmutsa.org/",
        },
        {
          src: "/activations/rowdyhacks.webp",
          width: 320,
          height: 320,
          alt: "RowdyHacks",
          name: "RowdyHacks XII",
          note: "Saturday's 24-hour hackathon. The team is here to say what it still needs \u2014 volunteers, mentors and judges \u2014 before the doors open.",
          href: "https://rowdyhacks.org/",
        },
      ],
      coda: "Geekdom's pitch to founders is that people are the unfair advantage \u2014 that a hard problem gets easier with the right person across the table, and that person is hard to find on your own, so they built the room where they already are. That room is the third floor of the Rand, which is the floor you would be standing on. A student who finds it in their first semester has four years of it, and that is the whole reason the community floor gives an evening to people who cannot yet put Geekdom on a r\u00e9sum\u00e9. Nobody has to join anything to talk to anyone.",
      // Two hosts, two borrowed registers, and both are deliberate. The coda
      // above is Geekdom's own argument in Geekdom's words — HOOK and MISSION
      // in next-geekdom's lib/site.ts are "make people your unfair advantage"
      // and "that person is hard to find on your own, so we built the room
      // where they already are". This kicker is DEVSA's tagline.
      //
      // DEVSA's own tagline, and used deliberately rather than paraphrased.
      // lib/locations.ts drops this same line from The Rand's description,
      // because there it was the event borrowing a partner's brand voice to
      // describe a venue. Here DEVSA hosts the night, the coda above names
      // them twice and hands the line over, so it reads as the host talking
      // rather than as marketing lifted from someone else.
      kicker: "Find your people. Build your future.",
      access:
        "Free, and free of the usual conditions \u2014 no badge, no pitch, no year requirement, and no need to be enrolled anywhere in particular.",
    },
  },
  // Thursday on the community floor, in time order: SATX Datanauts at one, the
  // AWS user group at two, Linux San Antonio's two hours at three, then Open
  // Circuit's hour at five, which hands the room straight over to the Bash a
  // block west at six.
  //
  // Four activations in one venue's run, which is EXPAND_MAX exactly. Thursday
  // now sits on the same ceiling Tuesday does, so there are two days one
  // activation away from folding into a summary block — and the note on
  // EXPAND_MAX says what that costs: every mark on the run disappears from
  // both views at once. A fifth here needs that threshold raised on purpose,
  // not discovered.
  //
  // The afternoon has been re-timed twice and the copy has to move with it: an
  // activation that calls itself "two hours" in its blurb, its lede or its
  // coda is wrong the moment its slot changes, and nothing here will catch
  // that. Open Circuit lost a "two hours" this way; Linux keeps its two, and
  // College Night on Tuesday keeps its own.
  {
    slug: "datanauts",
    page: "datanauts",
    // "Datanauts", and the mark says the same. They answer to three names —
    // "SATX Datanauts" in their own site header, "San Antonio Data Analytics
    // and AI — Datanauts" in its footer, and plain /datanauts on Meetup — and
    // this is the one that survives being drawn 75px wide in a one-hour block.
    // Dropping SATX costs nothing a reader needs: they are already looking at
    // a San Antonio schedule, on the San Antonio floor of it. The full name
    // appears once, in the lede, which is where a full name belongs.
    //
    // `title` rather than only the artwork, so the share card, the page
    // metadata, the calendar file and the screen-reader heading all say what
    // the mark says. A lockup reading "Datanauts" over an OG card reading
    // "SATX DATANAUTS" is the kind of split nobody notices until it is shared.
    title: "Datanauts",
    room: "the-rand",
    venueDetail: "3rd Floor",
    // Tech & Builders rather than AI & Applied Innovation, and it is a real
    // choice: their legal name carries "AI" and half their topic list is
    // MLOps and machine learning. But the group leads with data engineering,
    // BI and analytics, and AITX already holds the AI strand on this same
    // floor two days earlier — filing both there would blur the one useful
    // distinction between them.
    circuit: "Tech & Builders",
    site: { label: "satxdatanauts.com", href: "https://satxdatanauts.com/" },
    // Their helmet, with the name set beside it — a composed lockup, like the
    // .NET and AWS marks and for the same reason. Theirs is a symbol only:
    // 0.92:1, the squarest thing that has ever come near this grid, and at
    // that ratio no block on the schedule can draw it. A one-hour week block
    // caps a mark at 20px tall, which is 18px wide for a square, and
    // `markKind` would have thrown it out on sight.
    //
    // With the name attached it is 4.93:1 and lands at 99px wide in that same
    // block — clear of the 56px floor everywhere it is drawn, and well over
    // the 3:1 line that decides which width cap the page hero gives it. If
    // this ever gains words again, 3:1 is the number to watch, because
    // crossing it silently halves the mark on the activation page.
    //
    // The wordmark is ours, not theirs, which is the honest difference from
    // the .NET and AWS lockups — those attached words to a mark that already
    // had a wordmark. Datanauts publishes no lockup at all, and sets its own
    // name in a grotesque on its own site, so this is that arrangement in the
    // face this site already loads. Replace it the moment they publish one.
    //
    // Geist 500 at a cap height 58% of the helmet, gap 20% of it. 500 because
    // 600 read heavier than the helmet's line weight everywhere but the very
    // smallest draw, and because it is what the other two composed marks in
    // this directory use.
    //
    // 58 rather than the 40 this started at, and the difference is worth
    // stating because the two surfaces reward it very differently. The block
    // is height-capped, so a bigger cap ratio buys text directly: 8px of cap
    // at 40, 11.6px at 58, which is the 45% that made the name readable in a
    // one-hour slot. The hero is width-capped, so the whole lockup shortens as
    // it widens and the same change buys only 54.6px of cap against 60.3 —
    // the mark gets shorter while its type gets bigger. Both were measured at
    // those two sizes rather than judged at full resolution, where every
    // setting looks fine.
    //
    // Past about 66 the helmet stops reading as a companion mark and starts
    // reading as a bullet in front of a word. That is the ceiling, not a
    // target.
    //
    // Raster rather than vector because the helmet is raster. 1800px wide
    // against a 1024px largest real draw — the hero's 512 CSS pixels on a 2x
    // screen — WebP q92, 81KB, inside this directory's range.
    //
    // Overwriting this file at the same path does not update what the page
    // draws: Next's image optimiser caches by URL, so after a swap the block
    // kept measuring at the old ratio until `.next/cache/images` was cleared.
    // Worth knowing before concluding the new artwork is wrong.
    logo: {
      src: "/activations/datanauts.webp",
      width: 1800,
      height: 365,
      alt: "Datanauts",
    },
    when: {
      start: "2026-10-01T13:00:00-05:00",
      end: "2026-10-01T14:00:00-05:00",
    },
    // TODO(content): a speaker has not been named. That belongs in the
    // sessions CMS pointed at this slug — not here — which is what makes the
    // speaker page link back, and CMS rows supersede `detail` on the page.
    blurb:
      "San Antonio\u2019s grassroots gang of data people \u2014 pipelines, dashboards, models, and a mentorship programme that graduates you by putting you on stage.",
    detail: {
      eyebrow: "The hour",
      // Theirs, trimmed. The full line is "Because nobody gets into tech — or
      // survives it — alone", and the second half is the sharper one: plenty
      // of groups help people in, and the number that keep them there is much
      // smaller. The lede below carries the sentence whole.
      headline: "Nobody survives tech alone.",
      lede: [
        "SATX Datanauts is San Antonio\u2019s grassroots gang of data people \u2014 engineers, analysts, scientists and the plainly curious \u2014 across business intelligence, pipelines, machine learning and every buzzword in between. Their own reason for existing is one sentence: nobody gets into tech, or survives it, alone.",
        "The mentorship programme is the part worth knowing. You are paired with a mentor, you build a real portfolio on a track you pick \u2014 analytics, data engineering, ML or AI \u2014 and you graduate by giving a live talk at The Drop, their monthly night. Rolling admissions. In their words: no fluff, just ships.",
      ],
      coda: "Every city has people who can build a pipeline. What is rarer is a group that treats teaching one as the point rather than the overflow, and rarer still one whose graduation is a talk \u2014 so the person who was mentored last year is the one at the front this year. That is a mechanism rather than a mission statement, and it is the whole argument for giving this hour to them.",
      // Their three-part line, verbatim. It is the only place on this page
      // where the register is entirely theirs, and it is better than anything
      // this site would have written to summarise them.
      kicker:
        "Mentorship is our mission. Community is our power. Fun is non-negotiable.",
      access:
        "Free with Startup + Tech Week registration. Beginners and veterans both \u2014 their standing rule is no gatekeeping and no dense decks.",
    },
  },
  {
    slug: "aws-user-group",
    page: "aws-user-group",
    // This group answers to three names and all of them are real: Meetup has
    // it as "San Antonio AWS Users", their own site brands as "AWS Community
    // San Antonio", and the Meetup URL is /san-antonio-aws-users-group. The
    // mark beside the title reads "User Group" because that is the programme
    // they belong to — their site's own footer badge is "Part of the AWS User
    // Groups program" — so the title is set to match the mark rather than
    // leaving the page saying one thing and the lockup another.
    title: "San Antonio AWS User Group",
    shortTitle: "AWS User Group",
    room: "the-rand",
    venueDetail: "3rd Floor",
    circuit: "Tech & Builders",
    // Their own site, not the Meetup. The .NET group's home genuinely is its
    // Meetup page, so that is where that entry points; this group runs a real
    // site with their events, resources and a job board on it, and the Meetup
    // is the RSVP form for one of those things.
    site: { label: "sanantonioaws.com", href: "https://sanantonioaws.com/" },
    // The official AWS logo in white, with "User Group" set beside it in Geist
    // 500 at the same cap height — the same lockup rule the .NET mark follows,
    // and for the same reason: the two share a baseline and a cap line, so
    // they read as one line of type rather than a logo with a caption.
    //
    // The logo is the light-mode wordmark from builder.aws.com, taken as
    // outlines rather than recoloured art. It arrives as one path of six
    // subpaths, which measure into two groups — the "aws" letters at y 0-94
    // and the smile at y 112-180 — and that split is what sets the type. Cap
    // height is matched to the *letters* (94), not to the whole mark (180),
    // so the smile hangs below the line like a rule under the lockup. Matching
    // the full height instead was drawn and rejected: "User Group" came out
    // nearly twice the height of "aws" and read as the headline, with the
    // logo demoted to a bullet in front of it.
    //
    // The gap is 0.366 of the cap height, which is the .NET lockup's gap
    // expressed as a ratio, measured off the mark's ink edge. Here that edge
    // is the smile's right tip rather than the "s", so the type clears the
    // arrow by a few units instead of sitting on it.
    //
    // Baked into the file for the same reason the .NET one is: a typeset mark
    // built as a component leaves the lockup sizing path — the width-led
    // `lockupHeight`, the `axisMarkCap` that stops a one-hour block clipping —
    // and would need its own sizing at three block scales plus the page hero.
    // As a file it is an ordinary lockup and every call site keeps working.
    //
    // 5.49:1, which is mid-table here: wider than AITX (3.68) and ACM UTSA
    // (2.43), narrower than GDG (10.01) and the .NET lockup (8.12). The AWS
    // mark alone is 1.67:1, and width-led sizing draws anything that square
    // the tallest thing on the grid — the same trap ".NET" on its own fell
    // into. The words fix it as a side effect of saying who this is.
    logo: {
      src: "/activations/aws-user-group.svg",
      width: 1044,
      height: 190,
      alt: "San Antonio AWS User Group",
    },
    when: {
      start: "2026-10-01T14:00:00-05:00",
      end: "2026-10-01T15:00:00-05:00",
    },
    // TODO(content): the hour has one confirmed talk — "The Autonomous Hacker:
    // Zero-Trust AI Pentesting on AWS", on building an open-source autonomous
    // pentesting platform that orchestrates 65+ security tools over MCP under
    // a zero-trust architecture. It goes in the sessions CMS pointed at this
    // slug, with its speaker, and not in this file.
    //
    // That is not filing: a CMS row *replaces* everything under `detail`
    // below. Writing the talk here as well would put the same hour on the page
    // in two formats, one of which nobody can edit without a deploy, and the
    // hardcoded one would be the copy left standing if the row were ever
    // removed. The title is recorded in this comment so whoever enters it has
    // it to hand — comments do not render.
    //
    // ─── The hour, not the group ────────────────────────────────────────
    //
    // Two drafts of this page sold the host. The first led on their record —
    // founded 2018, twelve hundred members, which floor of which building
    // each past meetup was on. The second led on their virtues — a year-round
    // resource, hands-on labs, a curated shelf of free training, and the fact
    // that the shelf points at Azure and GCP as readily as at AWS. Every fact
    // in both was true and both were the wrong page: a reader deciding
    // whether to give up an hour is asking what happens in it.
    //
    // A third draft, and the reason is the layout rather than the words. The
    // second one led on the talk — "an hour on offensive security run by an
    // agent, red team work that used to take weeks" — which was right while
    // the talk lived in a section below the fold and the hero was all a reader
    // saw. It is not right now: the talk card sits immediately to the right
    // with the abstract, whose own opening line is "red team engagements
    // traditionally take weeks of manual setup". The blurb was paraphrasing a
    // paragraph the reader can see.
    //
    // So the card carries the talk and this carries the room, the same split
    // Google Developer Groups makes two entries up. "A meetup, not a
    // conference" is their own about page; the hands-on labs are their own
    // recent calendar. Naming the console is what stops it being a sentence
    // that would fit any user group in any city — the same job "AI Studio"
    // does for GDG.
    //
    // What went, so it is not reached for again: the Microsoft Learn and
    // Google Cloud line, which was a good argument that this room is not a
    // vendor channel and was still an argument about the host. And the job
    // board, which is 152 roles almost all of them remote postings from
    // partner companies rather than San Antonio work — it would have been the
    // one false note on the page.
    blurb:
      "San Antonio\u2019s AWS user group: a meetup rather than a conference, and a run of hands-on labs where the work happens in the console.",
    detail: {
      eyebrow: "The hour",
      // ─── Short, and about the talk ─────────────────────────────────────
      //
      // Two rules shaped what is left. It does not sell the host — see the
      // note above the blurb — and it does not reproduce the talk, because a
      // CMS row replaces this whole block the moment one is entered, and the
      // abstract belongs in the row where an organiser can edit it without a
      // deploy. So this describes the *kind* of hour and stops.
      //
      // Which is also why nothing here names the platform, the protocol or
      // the tool count. Those are the talk's own details, they sit in the
      // TODO above for whoever enters the row, and a page that printed them
      // would be carrying the abstract twice over — once editable, once not.
      //
      // The headline is the talk's premise rather than its title: a red team
      // engagement described in plain language, then executed. Two sentences,
      // which `ActivationDetail` sets one per line.
      headline: "Describe the test. Let it run.",
      lede: [
        "One talk, and a technical one. The subject is offensive security with an agent doing the work \u2014 red team engagements that have always meant weeks of manual setup, tool wrangling and write-up, driven instead from a plain-language description of what to test. Come with an opinion about how far that should be trusted.",
      ],
      access:
        "Free with Startup + Tech Week registration. All levels, which is the group\u2019s standing rule rather than a note about this talk.",
    },
  },
  {
    slug: "linux-satx",
    page: "linux-satx",
    title: "Linux San Antonio",
    room: "the-rand",
    venueDetail: "3rd Floor",
    circuit: "Tech & Builders",
    // Tux, and the name set in Geist Pixel Square beside him.
    //
    // The pixel face was vendored for The Model, retired when that band moved
    // to monospace, and turned down for Startup Bash because it read as a
    // borrowed voice — it belonged to an activation's brand sheet rather than
    // to SASTW. None of that applies here: the mark is a pixel-art penguin, so
    // a square-grid pixel face is the subject's own logic rather than someone
    // else's. The two share a grid and read as one lockup.
    //
    // Baked into the file rather than set at runtime, which is what keeps
    // app/fonts/pixel.ts dead code. Reviving it would put a 28KB woff2 preload
    // on every page in the site for one activation's wordmark; the glyph
    // outlines cost nothing here and work in the OG cards too. Same reason the
    // .NET lockup carries its "User Group" as paths.
    //
    // "SAN ANTONIO" is #FFC336, sampled from Tux's beak rather than picked.
    //
    // LINUX is set large enough to finish on SAN ANTONIO's width by itself
    // rather than being tracked out to reach it. Both give the type block a
    // straight right edge, which the first cut did not have — LINUX ended at
    // 40% of the line below and the silhouette was ragged — but tracking a
    // five-letter word that far apart stops it reading as a word at block
    // size, where "L I N U X" is five glyphs with gaps. Sizing keeps it one
    // word and buys a hierarchy for free: the platform is the headline and
    // the city qualifies it.
    logo: {
      src: "/activations/linux-satx.webp",
      width: 1600,
      height: 482,
      alt: "Linux San Antonio",
    },
    when: {
      start: "2026-10-01T15:00:00-05:00",
      end: "2026-10-01T17:00:00-05:00",
    },
    // TODO(content): speakers are being announced. They belong in the sessions
    // CMS pointed at this slug — that is what links the speaker pages back, and
    // CMS rows supersede `detail` on the page.
    blurb:
      "Two hours on the community floor for the people who actually run Linux \u2014 the environment, the tooling, the config you keep tuning. Part of the week, and free with it.",
    detail: {
      eyebrow: "The afternoon",
      headline: "Linux, on purpose.",
      lede: [
        "If you run Linux you already know why. The distro you settled on, the window manager you rebuilt twice, the dotfiles you will not stop tuning \u2014 this is two hours for the part of your setup nobody at work wants to hear about.",
        "Programming, mostly: the environment, the tooling, and the defaults you spend the day inside. Speakers are being announced. No booth, no vendor deck, and nobody refereeing a distro argument.",
      ],
      poweredBy: [
        {
          name: "learnOPENtech",
          href: "https://learnopentech.com/",
          logo: "/give-a-lot/learnopentech.svg",
          // A 10:1 wordmark, so height buys width ten times over — the same
          // h-5/h-6 Give-a-LOT's wall settled on for exactly this reason.
          heightClass: "h-5 sm:h-6",
        },
        {
          name: "Texas Linux Fest",
          href: "https://2026.texaslinuxfest.org/",
          logo: "/activations/txlf.webp",
          // 4.5:1, between the other two, and sized to land near
          // learnOPENtech's drawn width rather than its drawn height.
          heightClass: "h-8 sm:h-10",
        },
        {
          name: "DEVSA",
          href: "https://www.devsa.community/",
          // The same file Access Granted and Give-a-LOT use. Shared, not
          // copied, so a new mark lands everywhere at once.
          logo: "/access-granted/orgs/devsa.png",
          heightClass: "h-11 sm:h-13",
        },
      ],
      coda: "Every other room this week is about something being built \u2014 a company, a pitch, a product. This one is about the thing underneath it, which is the least glamorous and most load-bearing subject on the schedule. It runs because the people behind it already do this work here, and would rather spend a Thursday on it than a slide.",
      kicker: "Bring the laptop you actually use. Opinions come standard.",
      access:
        "Free with Startup + Tech Week registration. Discount codes for November\u2019s Texas Linux Fest are being handed out in the room.",
    },
  },
  {
    slug: "open-circuit",
    page: "open-circuit",
    title: "Open Circuit",
    room: "the-rand",
    venueDetail: "3rd Floor",
    // Social, deliberately, and the one place on this floor where that is not
    // the venue's own tag. The Rand runs Tech & Builders and every other
    // activation here follows it, which is the argument that was made for
    // filing this there too — a demo night is programme, not a room with
    // drinks in it, and the chip a builder presses is the one they would find
    // it under.
    //
    // It goes here instead because `circuit` is a single value and this event
    // is explicitly all five: the mark's own line is "5 Circuits. 1 Stage.",
    // TRACK_NAMES has exactly five, and the demo slot is five minutes to
    // match. Filing it under any one of them would be the page contradicting
    // its own headline. Social is the only value that does not pick a winner,
    // and it puts Open Circuit beside College Night and the Bash — which is
    // what the last hour of Thursday actually is, the week handing itself
    // over to the party a block west.
    circuit: "Social",
    // Their mark, cropped to its ink and nothing else touched. The file
    // arrives 1024 square with the artwork sitting in the middle of it; drawn
    // as delivered, every sizing path here would have measured the transparent
    // margin as part of the lockup and drawn the mark about half the size it
    // should be, in a box that looked mysteriously off-centre.
    //
    // 1.65:1 cropped, which makes it the squarest thing on the grid — squarer
    // than 1 Million Cups (2.00) and ACM UTSA (2.43), the mark that forced
    // `axisMarkCap` to grow its spare-rows branch in the first place. The
    // machinery handles it: a two-hour block returns a 42px cap, the lockup
    // takes it height-led, and the meta rows keep their room. Worth knowing
    // before anything about that sizing is "simplified".
    //
    // WebP at q95 rather than the source PNG: the mark is a gradient over
    // transparency, so it is 164KB as PNG and 48KB here, which is where the
    // rest of this directory lives. Measured on the composited result rather
    // than the raw channels — RGB under a zero alpha is undefined and will
    // report a difference of 255 that nothing can see — the worst pixel moves
    // by 21/255 inside a gradient, at a mark that draws 42px tall.
    logo: {
      src: "/activations/open-circuit.webp",
      width: 760,
      height: 462,
      alt: "Open Circuit",
    },
    when: {
      start: "2026-10-01T17:00:00-05:00",
      end: "2026-10-01T18:00:00-05:00",
    },
    // Five minutes, not the three the brief opened with, and not a rounding of
    // the conventional demo slot either — the mark says "5 Circuits. 1 Stage."
    // and the slot now says five too, so the number a reader meets twice on
    // this page is the same number both times. Anyone "fixing" it back to the
    // usual three would be breaking a rhyme, not a typo.
    blurb:
      "Five minutes, one screen, and whatever you actually built \u2014 an open-stage showcase across all five circuits, running straight into the week\u2019s closing bash.",
    detail: {
      // Not "The hour", which is what the other single-hour activations on
      // this floor use. Those are meetings that happen to run an hour; this
      // one is a format, and the format is the reason to come.
      eyebrow: "The showcase",
      // ─── Why this section is three lines long ──────────────────────────
      //
      // It was twice this, and most of it was the hero again. The blurb above
      // already carries the format, the five circuits and the handoff to the
      // Bash; a lede that opened on "five minutes, one screen" and a kicker
      // that closed on "plug in, show your work" were the same sentence a
      // second and third time, and the coda between them was an argument about
      // demos being unfakeable that nobody came to this page to read.
      //
      // Nothing replaces it, because this page has nothing else to hold. The
      // right-hand column of this section draws `programme` or `spotlight`,
      // and Open Circuit will never have either: no running order, no named
      // demos, and sign-ups taken in the room on the day. Five activations
      // here already ship with no `detail` at all, and the note on the hero
      // calls that the normal shape for a confirmed session.
      //
      // What survived is the part the hero cannot carry: whether a reader
      // qualifies, and what to walk in with. On an event whose entire
      // mechanic is turning up with a thing, those are worth a section on
      // their own — and cutting to them is what stops the page reading as
      // padding around a date.
      //
      // The organisers' headline stays whole. The hero draws the lockup
      // rather than the title, so this is the first time those words appear
      // anywhere on the page, and Oswald caps is the register they were
      // written in.
      headline: "5 Circuits. 1 Stage. Show What You Built.",
      lede: [
        "Shipped code this week, designed an interface, wired up an agent, deployed open-source hardware, cut something in a media app \u2014 all of it plugs in. No pitch deck, no slide, nothing that needs explaining before it runs. Come to show something, or come to see what the city is actually making.",
      ],
      // The one fact that was missing rather than repeated. There is no form
      // and no list: slots are taken in the room, in the order people arrive,
      // which a reader has no way to guess from a page with two buttons on it
      // that both do something else.
      access:
        "Free with Startup + Tech Week registration. Slots are claimed in the room on the day, in the order people turn up \u2014 so bring the build and whatever it runs on: laptop, phone, board, or a recording of the thing working.",
    },
  },
  {
    slug: "dotnet-user-group",
    page: "dotnet-user-group",
    title: "San Antonio .NET User Group",
    shortTitle: ".NET User Group",
    room: "the-rand",
    venueDetail: "3rd Floor",
    circuit: "Tech & Builders",
    // The group's own home is the Meetup, not dotnet.microsoft.com — that is
    // the platform's site, and pointing a reader at Microsoft to find out when
    // a San Antonio user group meets sends them to the wrong place.
    site: {
      label: "meetup.com/sadnug",
      href: "https://www.meetup.com/sadnug/",
    },
    // The official text-only mark in white, from github.com/dotnet/brand
    // The box comes from the glyphs' real ink bounds, not from the cap line.
    // Matching cap heights puts the caps exactly on y=0, and round capitals
    // overshoot the cap line — Geist's "G" reaches 726 against a cap height of
    // 710 — so the top of the G in "Group" sat 2.73 units outside the viewBox
    // and was clipped. Measuring the union of both halves and padding it is
    // the fix; a cap-height box is wrong for any face, not just this one.
    //
    // (CC0), set beside "User Group" in Geist 500 at the same cap height —
    // the two share a baseline and a cap line, so they read as one line of
    // type rather than a logo with a caption parked beside it. Same rule the
    // Startup Bash mark follows against the SASTW logo's own wordmark.
    //
    // A composed asset rather than a composed component, unlike Startup Bash.
    // Both would draw the same thing, but a typeset mark leaves the lockup
    // sizing path — the width-led `lockupHeight` and the `axisMarkCap` that
    // keeps a one-hour block from clipping — and would need its own sizing at
    // three block scales, on the page hero, and anywhere else a mark is drawn.
    // Baked into the file, it stays an ordinary lockup and every one of those
    // call sites keeps working untouched.
    //
    // It also fixes the size complaint by itself. ".NET" alone is 2.67:1, and
    // width-led sizing gives anything that square the tallest draw on the
    // grid — 84px in the agenda against Google Developer Groups' 23. With the
    // words attached the lockup is 7.9:1 and lands at 28, which is where it
    // belongs next to the other two.
    logo: {
      src: "/activations/dotnet-user-group.svg",
      width: 12768,
      height: 1573,
      alt: "San Antonio .NET User Group",
    },
    when: {
      start: "2026-09-29T13:00:00-05:00",
      end: "2026-09-29T14:00:00-05:00",
    },
    // Their own description is "for anyone interested in a wide range of .NET
    // topics around the San Antonio, Texas area" — deliberately broad, and the
    // recent run of talks bears it out.
    blurb:
      "San Antonio's .NET group, running since long before this week existed \u2014 C#, cloud, and lately agentic AI, for anyone who writes on the platform.",
    detail: {
      eyebrow: "The hour",
      headline: "Still meeting, thirty-one events in.",
      lede: [
        "The San Antonio .NET User Group is for anyone interested in a wide range of .NET topics around the San Antonio area \u2014 their words, and the back catalogue holds them to it: serverless, cross-platform builds, testing, CI/CD, and a recent run on C# with agentic AI.",
        "Most of the last year ran online. This hour is the group back in a room.",
      ],
      coda: "Platform user groups are the least fashionable and most durable thing in a tech scene. They were meeting before the week was announced and they will be meeting after it \u2014 which is the whole argument for giving the community floor to the groups that already do the work.",
    },
  },
  {
    slug: "stumberg-venture-competition",
    page: "stumberg-venture-competition",
    // The full name, which is how Trinity bills it: their own banner in the
    // hall reads "LOUIS H. STUMBERG / VENTURE COMPETITION", and the lockup
    // beside this is set to match it word for word.
    //
    // Still not "2026 Stumberg Venture Competition, Final Round", which is the
    // Eventbrite listing's title and carries two facts this site states
    // elsewhere. The year is the whole site, and the round is the first thing
    // the blurb says — and a title has to survive being the alt text on a
    // lockup and the heading a screen reader announces. That one does not.
    title: "Louis H. Stumberg Venture Competition",
    // The share card drops the benefactor too, for its own reason — see
    // `ogTitle`.
    ogTitle: "Stumberg Venture Competition",
    // The name without the benefactor, which is what fits.
    //
    // "Stumberg" alone was here first and it is too short — on its own the
    // word names a man rather than a competition, and it is what the block's
    // aria-label and the admin's picker read out. The full title is too long
    // the other way: at 13px in the narrowest week lane it runs to three lines
    // and takes a third of the card off the artwork underneath it.
    //
    // This is the middle, and it is not a new idea — the brunch's short form
    // is "The Creative Futures Brunch" at 27 characters, one shy of this.
    shortTitle: "Stumberg Venture Competition",
    room: "trinity",
    venueDetail: "Ruth Taylor Recital Hall",
    // Capital, with Mission Pitch and Latin Tech Pitch — the week's other two
    // rooms where money is decided in front of an audience rather than
    // discussed. That the founders are students is a fact about who pitches
    // rather than about what the hour is.
    circuit: "Capital",
    site: {
      label: "trinity.edu/entrepreneurship",
      href: "https://trinity.edu/entrepreneurship",
    },
    // The one activation on the site that is entered somewhere other than
    // the week's own list — see `register` in the interface above. Trinity
    // ticket it themselves and it is free; what a Startup + Tech Week badge
    // does not do is get you through this door, and the default CTA would
    // have said otherwise on the one page where it is not true.
    register: {
      label: "Get a ticket.",
      href: "https://www.eventbrite.com/e/2026-stumberg-venture-competition-final-round-tickets-1985586357245",
    },
    // The event's own mark — Trinity's, the two heads and their gears — set
    // beside the competition name in Geist 500 over two lines. The same
    // lockup rule the .NET and AWS marks follow, and here it is doing more
    // work than either: the illustration carries no name at all, so on its own
    // it identifies nothing, and the drawing is line art whose strokes measure
    // 12px at 1024 wide. Scaled to a week block that is roughly one physical
    // pixel, which is the width at which a thin outline stops being a drawing
    // and becomes a grey smudge. The type is what survives the small sizes;
    // the mark is what makes it Trinity's at the large ones.
    //
    // Two lines rather than one for the ratio. Set on a single line the
    // lockup runs 7.9:1 and the type inside a block is drawn tiny to fit;
    // stacked it is 6.26:1, between AWS (5.49) and the .NET lockup (8.12),
    // and every word comes out twice the height for the same block width.
    //
    // The strokes were also tried dilated, so they would hold at block scale
    // without the type carrying them. Rejected: it closes the gear teeth and
    // the pupils, and at hero size the heads read as two blobs. Thin and
    // honest at the top end beats thick and wrong at both.
    logo: {
      src: "/activations/stumberg.webp",
      width: 2915,
      height: 466,
      alt: "Louis H. Stumberg Venture Competition",
    },
    // The same two heads, cut out of the lockup above and drawn on their own
    // in the week block. See `blockArt`.
    blockArt: {
      src: "/activations/stumberg-mark.webp",
      width: 1024,
      height: 791,
    },
    // 5:00 to 7:30, which is the pitches and the reception together — the
    // whole of what someone is committing an evening to. Doors are 4:30 and
    // are in the programme below rather than here, for the same reason the
    // brunch's 7:30 doors are not its start time: an hour on the grid is what
    // is programmed, and a calendar entry that begins when the room unlocks
    // makes every reader half an hour early.
    when: {
      start: "2026-09-29T17:00:00-05:00",
      end: "2026-09-29T19:30:00-05:00",
    },
    // Trinity's own photograph of the competition in this hall — the raked
    // seating full, two founders on the boards with microphones, and their
    // banner against the wood at the left. It is the one image that says what
    // this evening is without a caption, which is the whole test for a picture
    // that gets masked and dimmed behind the copy.
    //
    // It is a seed round, not a final: the banner's third line reads "Seed
    // Round" at full size. Nothing is cropped to hide that — the hero lays the
    // whole frame in and masks it, and the banner happens to sit in the half
    // the scrim takes, so the line is not legible on the page either way. The
    // room and the format are identical, and a photograph of the actual final
    // will not exist until the night itself. Swap it for one afterwards.
    hero: {
      src: "/activations/stumberg-hero.jpg",
      width: 1800,
      height: 1200,
      alt: "Two Trinity students pitching to a full recital hall at the Louis H. Stumberg Venture Competition",
    },
    blurb:
      "The final round of Trinity\u2019s student venture competition: five teams already funded once, back on stage for a $50,000 prize decided the same night.",
    detail: {
      eyebrow: "The evening",
      // The format, in two sentences, which is the whole of what makes this
      // different from a demo night: something is actually decided.
      headline: "Five teams pitch. One leaves funded.",
      lede: [
        "Five student ventures pitch live for a $50,000 grand prize. Every one of them has been funded once already \u2014 $7,000 and a place in Trinity\u2019s incubator, won in the seed round earlier in the year \u2014 so this is not a room of first drafts. It is five teams who have had money and the time to spend it, back to show what it bought.",
        "The 2026 finalists are Gratzi, MEQ for You, PassItOn, SofraWise and The Recharge Pod. The decision happens in the room, and the hour after it is where you meet the founders.",
      ],
      // Three rows, and the only reason this activation has a programme at all
      // is that its hour splits. "5:00 – 7:30 PM" in the hero is accurate
      // and tells a reader nothing about which half is the pitches, or that
      // the last hour is a reception they can arrive at the end of.
      programme: [
        {
          time: "4:30 PM",
          title: "Doors",
          body: "The recital hall opens. Free parking in the Alamo Stadium lot, a short walk from the building.",
        },
        {
          time: "5:00 \u2013 6:30 PM",
          title: "The pitches",
          body: "Five ventures, live, in front of the judges and the room. This is the whole competition \u2014 there is no second sitting.",
        },
        {
          time: "6:30 \u2013 7:30 PM",
          title: "Reception",
          body: "The result, and then an hour with the founders and the people who backed them.",
        },
      ],
      // Said plainly, because it is the one thing on this site that is not
      // covered by the week's registration and a reader who assumes otherwise
      // finds out at the door.
      access:
        "Free, and ticketed by Trinity on Eventbrite rather than covered by your Startup + Tech Week registration \u2014 this is Trinity\u2019s competition, on their campus, and the week is on the guest list rather than the host. Three miles north of downtown; free parking in the Alamo Stadium lot.",
    },
  },
];

/** The week's timezone. Every label and calendar stamp is resolved in it. */
const TZ = "America/Chicago";

/**
 * The short form, for anywhere a full "Monday, September 28, 2026" would
 * crowd the layout — the schedule cards and the week strip.
 *
 * Same `when` and the same timezone as whenLabels, so the card and the page it
 * links to can't disagree about the day.
 */
export function whenShort(when: { start: string; end: string }) {
  const start = new Date(when.start);
  return {
    day: start.toLocaleDateString("en-US", {
      timeZone: TZ,
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    time: start
      .toLocaleTimeString("en-US", {
        timeZone: TZ,
        hour: "numeric",
        minute: "2-digit",
      })
      .replace(":00", ""),
  };
}

/** Which of the week's days a confirmed slot falls on, as `YYYY-MM-DD`. */
/**
 * The date range of a multi-day activation, as "Sep 28 – 30".
 *
 * Give-a-LOT's drop-off runs across three days: it has a `span` and no `when`,
 * which is exactly right in the data and reads as missing everywhere that only
 * knows about `when`. The venue card said "Time still landing" for it and the
 * day grouping filed it under "slot to be confirmed" — both stating the
 * opposite of the truth for the one activation whose dates have been fixed
 * longest.
 *
 * Drops the second month name where both ends share one, which for a five-day
 * week in one month is always. See the same rule on the calendar's spans.
 */
export function spanLabel(span: { from: string; to: string }): string {
  const meta = (iso: string) => EVENT_DAYS.find((d) => d.iso === iso)?.label;
  const from = meta(span.from);
  const to = meta(span.to);
  if (!from || !to) return "";
  if (from === to) return from;
  return sameMonth(from, to)
    ? `${from} – ${to.split(" ")[1]}`
    : `${from} – ${to}`;
}

/**
 * The day an activation belongs to, and its heading, for grouping a list.
 *
 * Venue pages showed a room's whole week as one flat grid of cards ordered by
 * date, with the day printed small on each. That reads as a pile: nothing tells
 * you The Rand runs four things on Tuesday and one on Friday without checking
 * five cards. Grouping is what turns the same data into a schedule.
 *
 * Returns null for a session with no confirmed slot and for a `span`, both of
 * which belong outside the per-day grouping rather than under a day they do
 * not have.
 */
export interface DayMeta {
  iso: string;
  weekday: string;
  label: string;
}

/**
 * A day of the week, named — from its ISO date alone.
 *
 * Split out of `sessionDay` because a venue page now groups two things by day:
 * hardcoded activations, which carry a `when`, and CMS sessions, which arrive
 * as CalendarItems carrying a `dayIso` and nothing to derive one from. Both
 * need the same heading.
 *
 * Returns null for a date outside the week, which is the honest answer — a
 * heading for a day the event does not run is worse than the row being
 * dropped.
 */
export function dayMeta(iso: string): DayMeta | null {
  const meta = EVENT_DAYS.find((d) => d.iso === iso);
  if (!meta) return null;
  return {
    iso,
    // Parsed with the week's own offset, so the weekday cannot slip a day for
    // a reader in another timezone — the same reason `dayKey` exists.
    weekday: new Date(`${iso}T12:00:00-05:00`).toLocaleDateString("en-US", {
      timeZone: TZ,
      weekday: "long",
    }),
    label: meta.label,
  };
}

export function sessionDay(session: ResolvedSession): DayMeta | null {
  if (!session.when) return null;
  return dayMeta(dayKey(session.when.start));
}

function dayKey(iso: string): string {
  // en-CA gives ISO order; bucketing on the venue's clock rather than the
  // reader's is what stops a 6pm Thursday event showing up on Friday for
  // someone browsing from Europe.
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

export interface DayColumn {
  iso: string;
  /** "Mon", for the column head. */
  weekday: string;
  /** "Sep 28". */
  label: string;
  sessions: ResolvedSession[];
}

/**
 * The whole week as five columns, for the strip at the top of /schedule.
 *
 * Every day in EVENT_DAYS appears whether or not anything is confirmed on it —
 * a day the reader can see is empty-for-now is information; a day silently
 * missing from the list is a hole they have to notice themselves.
 */
export function scheduleByDay(): DayColumn[] {
  const withTimes = resolveSessions(allSessions()).filter((s) => s.when);
  return EVENT_DAYS.map((d) => ({
    iso: d.iso,
    weekday: new Date(`${d.iso}T12:00:00-05:00`).toLocaleDateString("en-US", {
      timeZone: TZ,
      weekday: "short",
    }),
    label: d.label,
    sessions: withTimes
      .filter((s) => dayKey(s.when!.start) === d.iso)
      .sort((a, b) => a.when!.start.localeCompare(b.when!.start)),
  }));
}

// ─── The week as a calendar ─────────────────────────────────────────────────
//
// `scheduleByDay` answers "what is on each day" as five lists. This answers
// "what does the week look like", which is a different question and wants a
// time axis: the reader's real problem is that four venues run a takeover
// simultaneously on the same afternoon, and a list cannot show simultaneous.
//
// Two things make an hour axis viable here rather than a wall of whitespace:
//
//  1. The week is bottom-heavy on purpose. Nearly every activation is a 1–6 PM
//     takeover, so the axis only has to cover the afternoon and evening — see
//     `calendarAxis`, which derives the window from the data instead of
//     assuming a working day. A literal 7 AM – 9 PM grid would be half empty.
//  2. The genuine outliers — the Thursday brunch, and anything else that has
//     finished before noon — come off the axis entirely and ride a rail above
//     it, the same way a calendar treats an all-day event.
//
// Lane assignment is deliberately NOT done here. Which activations overlap
// depends on which ones are currently filtered in, and the filters are client
// state; computing lanes on the server would lay the grid out for a week the
// reader isn't looking at. This projects flat, positioned items and the client
// resolves collisions after filtering.

/** Anything that has ended by noon comes off the hour axis onto the rail. */
const MORNING_CUTOFF = 12 * 60;

/** Minutes past midnight on the venue's clock, not the reader's. */
function minutesInTz(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    // h23 rather than `hour12: false`, which renders midnight as "24" on some
    // ICU builds and would sort a 12 AM event to the end of its own day.
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const at = (type: string) =>
    Number(parts.find((part) => part.type === type)!.value);
  return at("hour") * 60 + at("minute");
}

/**
 * "1 – 6 PM", "7:30 – 11:30 AM" — the block label.
 *
 * Tighter than `whenLabels`, which spells out "1:00 PM – 6:00 PM" for a page
 * heading with room for it. A block in a five-across grid does not have that
 * room, so a redundant `:00` and a repeated meridiem are both dropped.
 */
/**
 * One time, with its meridiem — for a session that has a start and no end.
 *
 * `compactRange` cannot answer this: it needs both ends to decide whether the
 * first one carries an "AM"/"PM" of its own. A block with no end has to state
 * the fact it actually holds and stop, rather than print a finish nobody
 * entered.
 */
export function clockLabel(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h24 < 12 ? "AM" : "PM"}`;
}

export function compactRange(startMin: number, endMin: number): string {
  const clock = (min: number, meridiem: boolean) => {
    const h24 = Math.floor(min / 60);
    const m = min % 60;
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h}${m ? `:${String(m).padStart(2, "0")}` : ""}${
      meridiem ? ` ${h24 < 12 ? "AM" : "PM"}` : ""
    }`;
  };
  const sameHalf = startMin < MORNING_CUTOFF === endMin < MORNING_CUTOFF;
  return `${clock(startMin, !sameHalf)} – ${clock(endMin, true)}`;
}

/**
 * An activation's own brand, flattened for the calendar block that draws it.
 *
 * Five of the nine activations have a brand of their own, and they carry it in
 * two different ways: the three with a band on /schedule have an accent colour
 * (Access Granted's green, PySanAntonio's blue, The Model's lavender), while
 * the pitch events have a lockup file and no colour. PySanAntonio has both.
 * So this is deliberately all-optional — a block takes whichever half exists
 * and falls back to the house treatment for the rest.
 *
 * Flattened to plain strings rather than importing lib/the-model and friends
 * into the grid: those modules are the bands' full content, and the client
 * needs four hex values and a file path out of them.
 */
export interface CalendarBrand {
  /**
   * The keyline colour.
   *
   * Deliberately the one signal that survives every block size — a border
   * needs no room, so an activation stays recognisable in a quarter-width
   * lane where its lockup cannot be drawn at all.
   */
  accent?: string;
  /** An image lockup, where one exists. */
  lockup?: { src: string; width: number; height: number; alt: string };
  /**
   * The mark without its wordmark, for a block that draws the two apart.
   *
   * See `blockArt` on FeaturedSession. Only the week and day blocks use it;
   * everything else takes `lockup`.
   */
  art?: { src: string; width: number; height: number };
  /**
   * A typeset lockup the grid knows how to draw itself.
   *
   * Access Granted and The Model have no wordmark file — their marks are set
   * in type, which is exactly why the question "can the calendar use their
   * fonts" has a real answer for these two and not for the others. Same two
   * cases session-bento's `BrandLockup` special-cases, keyed the same way, on
   * `page` rather than on the title, because the title is copy.
   *
   * Open Circuit joins them from the other direction: it has a file, and the
   * file is too square to survive a one-hour block. See `brandFor` below.
   */
  wordmark?:
    | "the-model"
    | "access-granted"
    | "startup-bash"
    | "college-night"
    | "open-circuit";
  /** The ink inside The Model's selection block. */
  ink?: string;
}

/**
 * The brand for an activation, or undefined where it has none.
 *
 * Keyed on `page` for the two typeset marks, matching session-bento. The
 * lockup comes off the session's own `logo`, so an activation that gains one
 * in the data gains it here with no change.
 */
function brandFor(session: ResolvedSession): CalendarBrand | undefined {
  const accent =
    session.page === "access-granted"
      ? ACCESS_GREEN
      : session.page === "pysanantonio"
        ? PYSA_BLUE
        : session.page === "the-model"
          ? MODEL_LAVENDER
          : undefined;
  // Open Circuit is the one brand here that carries both, and the two are not
  // alternatives — `markKind` prefers the file wherever it can draw it big
  // enough and takes this as the fallback. Its 1.65:1 lockup is 33px wide in a
  // one-hour week block, where a typeset mark in the activation's own register
  // beats both an unreadable logo and a plain sentence-case title.
  const wordmark =
    session.page === "access-granted" ||
    session.page === "the-model" ||
    session.page === "startup-bash" ||
    session.page === "college-night" ||
    session.page === "open-circuit"
      ? session.page
      : undefined;
  if (!accent && !wordmark && !session.logo) return undefined;
  return {
    accent,
    wordmark,
    ink: session.page === "the-model" ? MODEL_INK : undefined,
    lockup: session.logo,
    art: session.blockArt,
  };
}

/** One activation with a confirmed hour, positioned on the axis. */
export interface CalendarItem {
  slug: string;
  /** `shortTitle ?? title` — a block is narrower than a card. */
  title: string;
  /**
   * The full title, for the one surface with room for it.
   *
   * `shortTitle` exists because "The Creative Futures™ Brunch powered by The
   * Down Market" is 54 characters carrying two brands, and in a quarter-width
   * lane it swamps everything beside it. An agenda row is 500px of clear space
   * — the place the organisers' full title belongs.
   */
  longTitle: string;
  /**
   * Where to force the wrap, when the title carries a trailing credit.
   *
   * Left to itself the break lands mid-phrase and the partner's name splits
   * across two lines. Copied from the activation's own `titleBreakBefore`, so
   * the row breaks where the bento card and the hero already break.
   */
  titleBreak?: string;
  page: string | null;
  dayIso: string;
  startMin: number;
  endMin: number;
  /**
   * Pre-formatted; the client has no business re-deriving a timezone.
   *
   * Only drawn where the block cannot express its own time: the morning rail,
   * the mobile stack, and axis blocks too short to hold anything else. A block
   * sitting on the hour grid already states its hours by where it starts and
   * how far it runs, which is the entire point of an axis — printing "1 – 6 PM"
   * inside it spends the block's best line restating its own geometry.
   */
  timeLabel: string;
  /** True when this has finished by noon and belongs on the rail. */
  morning: boolean;
  venueSlug: string;
  venueName: string;
  /** `shortName ?? name` — what a narrow lane prints instead of truncating. */
  venueShort: string;
  /**
   * The room's tier, carried across so the client can charge a block by it
   * without importing lib/locations — which is the whole reason this
   * projection exists (see week-strip.tsx for the same split).
   *
   * Circuits deliberately have no colours of their own, so the grid cannot
   * tint a block by strand. Venue hierarchy is what it charges instead: the
   * anchor burns hottest, the day rooms sit under it, the one-night rooms
   * stay unlit. That is also the honest reading of this week — four venues
   * running simultaneous 1–6 PM takeovers means the axis says almost nothing
   * and the room says everything.
   */
  venueTier: RoomTier;
  circuit: string;
  /**
   * Who is on, where the block knows.
   *
   * Only CMS sessions carry it: a hardcoded activation is a room's whole
   * afternoon and the people inside it are a running order, not a byline. A
   * session is one talk, and the speaker is most of what a reader wants from
   * it — so it rides on the item rather than being fetched again per surface.
   *
   * Pre-joined, like `timeLabel`, because the list separator is a formatting
   * decision and the client has no more business making it than it has
   * re-deriving a timezone.
   */
  people?: string;
  /** The activation's own brand, where it has one. */
  brand?: CalendarBrand;
  /** Whether a calendar file can be built for it — drives the export toggle. */
  exportable: boolean;
}

/** An activation that spans days and has no hour — the all-day rail. */
export interface CalendarSpan {
  slug: string;
  title: string;
  page: string | null;
  /** Indices into `EVENT_DAYS`, inclusive, so the rail can span columns. */
  fromIndex: number;
  toIndex: number;
  dayLabel: string;
  venueSlug: string;
  venueName: string;
  venueTier: RoomTier;
  circuit: string;
  brand?: CalendarBrand;
}

export interface WeekCalendar {
  days: { iso: string; weekday: string; label: string }[];
  items: CalendarItem[];
  spans: CalendarSpan[];
  /** The hour window the axis covers, in minutes past midnight. */
  axis: { startMin: number; endMin: number };
}

/**
 * The axis window, floored and ceiled to whole hours.
 *
 * Derived rather than pinned to 1–8 PM so that the first activation to land
 * outside today's shape — a noon start, a 9 PM close — grows the grid instead
 * of being drawn off the top of it. Morning items are excluded from the
 * derivation by definition: they are the reason the rail exists.
 *
 * The fallback matters more than it looks. With every activation on the rail
 * and none on the axis, `Math.min()` of an empty list is `Infinity` and the
 * grid would be laid out with a negative height.
 */
function calendarAxis(items: CalendarItem[]): {
  startMin: number;
  endMin: number;
} {
  const onAxis = items.filter((i) => !i.morning);
  if (onAxis.length === 0) return { startMin: 13 * 60, endMin: 18 * 60 };
  const first = Math.min(...onAxis.map((i) => i.startMin));
  const last = Math.max(...onAxis.map((i) => i.endMin));
  return {
    startMin: Math.floor(first / 60) * 60,
    endMin: Math.ceil(last / 60) * 60,
  };
}

/** Whether two "Sep 28"-style labels share a month. */
function sameMonth(a: string, b: string): boolean {
  return a.split(" ")[0] === b.split(" ")[0];
}

/**
 * How long a block runs when nobody said when it ends.
 *
 * `endsAt` is optional in the session form, and an axis block has to have a
 * height — there is no way to draw "starts at one and runs for a while". An
 * hour is the least surprising guess and it is only ever a *placement*: the
 * block's own label prints the start alone, so the grid never states a finish
 * that nobody entered.
 */
export const ASSUMED_MINUTES = 60;

/**
 * CMS sessions that stand on their own, as blocks the calendar can draw.
 *
 * ─── Why only the ones with no activation ───────────────────────────────────
 *
 * A session that names an activation is already on the grid — inside it. The
 * GDG talk runs 2–3pm at The Rand and so does the Google Developer Groups
 * activation it belongs to; the AWS talk and its user group are the same hour
 * in the same room. Drawing both would put the same hour on the calendar twice,
 * once as the host and once as its contents, and a reader would count two
 * things happening where there is one. Those rows already render, in the
 * activation's own running order, which is where a talk inside a takeover
 * belongs.
 *
 * So this is the other half of that rule rather than a filter for tidiness:
 * `activation: null` is the session form's way of saying "this is its own
 * thing in the week", and until now nothing on the site drew it.
 *
 * ─── What a CMS row cannot give the grid ────────────────────────────────────
 *
 * `page` is null, so the block renders without a link — `Block` has always
 * supported that, because the type has always allowed it.
 *
 * These are exportable all the same. `exportable` was false here at first, on
 * the reasoning that no page means no `.ics` route to point at — but a
 * calendar entry wants a start, an end, a title and a room, and a row has all
 * four; `URL` is the only field it cannot fill, and that field is optional.
 * The flag matters most for exactly this content: an afternoon-long activation
 * is something you turn up to, while a thirty-minute talk in one room at 3:30
 * is the case add-to-calendar exists for. Leaving it false also made `ADD DAY`
 * quietly wrong — it takes the day's *exportable* items, so it would have
 * added the activations and skipped the talks with nothing on screen saying
 * so. `/schedule/export.ics` resolves these rows alongside the curated week.
 *
 * `brand` is undefined, so it draws its title in type rather than a lockup.
 * That is the same path every activation without a logo file already takes.
 *
 * `track` is optional in the form, and an empty circuit prints nothing rather
 * than an empty line — see the note in `Block`.
 *
 * Pure, and takes its rows as an argument, so this file stays importable from
 * the client components that read `CalendarItem` off it. The Firestore read
 * lives in lib/live-schedule.
 */
export function standaloneItems(rows: SessionRow[]): CalendarItem[] {
  return rows.flatMap((row) => {
    if (row.activation) return [];

    // Rows saved before the venue picker hold free text; `roomSlugFromLegacy`
    // is the same best-guess the admin table uses. A row whose venue still
    // cannot be resolved is dropped, because a block with no lane has nowhere
    // to be drawn.
    const venue =
      ROOMS.find((r) => r.slug === row.location) ??
      ROOMS.find((r) => r.slug === roomSlugFromLegacy(row.location));
    if (!venue) return [];

    const startIso = new Date(row.startsAt).toISOString();
    const startMin = minutesInTz(startIso);
    const endMin = row.endsAt
      ? minutesInTz(new Date(row.endsAt).toISOString())
      : startMin + ASSUMED_MINUTES;

    return [
      {
        // The Firestore id. Unique by construction, stable across edits, and
        // it never collides with an activation slug.
        slug: row.id,
        title: row.title,
        longTitle: row.title,
        page: null,
        dayIso: dayKey(startIso),
        startMin,
        endMin,
        timeLabel: row.endsAt
          ? compactRange(startMin, endMin)
          : clockLabel(startMin),
        morning: endMin <= MORNING_CUTOFF,
        venueSlug: venue.slug,
        venueName: venue.name,
        venueShort: venue.shortName ?? venue.name,
        venueTier: venue.tier,
        circuit: row.track ?? "",
        people:
          row.participants
            .map((who) => who.name)
            .filter(Boolean)
            .join(", ") || undefined,
        exportable: true,
      },
    ];
  });
}

export function weekCalendar(extra: CalendarItem[] = []): WeekCalendar {
  const resolved = resolveSessions(allSessions());

  const items: CalendarItem[] = resolved
    .filter((s) => s.when)
    // Annotated, because `concat` below needs the element type to be
    // CalendarItem exactly. Inferred, the object literal comes out without the
    // optional `brand` and the two arrays stop being the same shape.
    .map((s): CalendarItem => {
      const startMin = minutesInTz(s.when!.start);
      const endMin = minutesInTz(s.when!.end);
      return {
        slug: s.slug,
        title: s.shortTitle ?? s.title,
        longTitle: s.title,
        titleBreak: s.titleBreakBefore,
        page: s.page ?? null,
        dayIso: dayKey(s.when!.start),
        startMin,
        endMin,
        timeLabel: compactRange(startMin, endMin),
        morning: endMin <= MORNING_CUTOFF,
        venueSlug: s.venue.slug,
        venueName: s.venue.name,
        venueShort: s.venue.shortName ?? s.venue.name,
        venueTier: s.venue.tier,
        circuit: s.circuit,
        brand: brandFor(s),
        // Only activations with a page have a per-session .ics route, and only
        // those with `when` have anything to put in one.
        exportable: !!s.page,
      };
    })
    // The CMS's own sessions, alongside the curated week. Concatenated before
    // the sort rather than after, so a standalone session takes its lane by
    // start time like everything else instead of being stacked on the end.
    .concat(extra)
    // Ordered by start, then by the canonical room order, so lane assignment
    // downstream is stable: without the tiebreak two activations starting at
    // the same minute could swap columns between renders.
    .sort(
      (a, b) =>
        a.startMin - b.startMin ||
        ROOMS.findIndex((r) => r.slug === a.venueSlug) -
          ROOMS.findIndex((r) => r.slug === b.venueSlug),
    );

  const dayIndex = new Map(EVENT_DAYS.map((d, i) => [d.iso, i]));
  const spans: CalendarSpan[] = resolved
    // `when` wins where an activation somehow carries both — see the note on
    // `span`. Drawing it on the axis and the rail reads as two events.
    .filter((s) => s.span && !s.when)
    .flatMap((s) => {
      const from = dayIndex.get(s.span!.from);
      const to = dayIndex.get(s.span!.to);
      // A span reaching outside the week is dropped rather than clamped: it
      // means the dates are wrong, and a silently shortened bar hides that.
      if (from === undefined || to === undefined || to < from) return [];
      return [
        {
          slug: s.slug,
          title: s.shortTitle ?? s.title,
          page: s.page ?? null,
          fromIndex: from,
          toIndex: to,
          // "Sep 28 – 30" rather than "Sep 28 – Sep 30" where the month is
          // the same, which for a five-day week in one month is always. The
          // second "Sep" is four characters that say nothing, and on a phone
          // they were the four that pushed the label onto a second line and
          // broke it as "Sep 28 – Sep / 30".
          dayLabel:
            from === to
              ? EVENT_DAYS[from].label
              : sameMonth(EVENT_DAYS[from].label, EVENT_DAYS[to].label)
                ? `${EVENT_DAYS[from].label} – ${EVENT_DAYS[to].label.split(" ")[1]}`
                : `${EVENT_DAYS[from].label} – ${EVENT_DAYS[to].label}`,
          venueSlug: s.venue.slug,
          venueName: s.venue.name,
          venueTier: s.venue.tier,
          circuit: s.circuit,
          brand: brandFor(s),
        },
      ];
    });

  return {
    days: EVENT_DAYS.map((d) => ({
      iso: d.iso,
      weekday: new Date(`${d.iso}T12:00:00-05:00`).toLocaleDateString("en-US", {
        timeZone: TZ,
        weekday: "short",
      }),
      label: d.label,
    })),
    items,
    spans,
    axis: calendarAxis(items),
  };
}

/** One venue running on a given day — a column in the day view. */
export interface DayVenue {
  slug: string;
  name: string;
  short: string;
  tier: RoomTier;
  count: number;
}

export interface DayCalendar {
  day: { iso: string; weekday: string; label: string };
  /** Only the rooms with something on, in canonical ROOMS order. */
  venues: DayVenue[];
  items: CalendarItem[];
  spans: CalendarSpan[];
  axis: { startMin: number; endMin: number };
  /** Where this day sits in the week, for prev/next. */
  index: number;
}

/**
 * One day, with the venues as columns.
 *
 * The other half of the answer to a dense week. The week view has to fit five
 * days across the page, so every venue running at once shares one 240px column
 * and a thirty-minute slot ends up 80px wide; here a day has the whole width
 * and TPR gets a column of its own, which is both wider than a day column in
 * the week view and free of lane collisions — a room cannot overlap itself.
 *
 * Two deliberate differences from `weekCalendar`:
 *
 *  - The axis is derived from this day alone, so a quiet day draws short.
 *
 * The morning rail is shared with the week rather than skipped. It used to be
 * skipped on the argument that a detail view should show the day's true shape,
 * including the fact that Thursday has a morning and an evening and nothing
 * between them. Drawn, that shape was a 7:30 AM start, a 90-minute void from
 * 11:30 and an afternoon below the fold — the reader lost the rest of the day
 * to make a point about its emptiness. So Thursday's brunch rides the rail
 * here as it does in the week, and both views open at 1 PM.
 */
export function dayCalendar(
  iso: string,
  extra: CalendarItem[] = [],
): DayCalendar | null {
  const index = EVENT_DAYS.findIndex((d) => d.iso === iso);
  if (index === -1) return null;
  const meta = EVENT_DAYS[index];

  // The day view is a filter over the week, so a standalone session reaches it
  // by the same route and lands in its room's lane with no extra wiring.
  const all = weekCalendar(extra);
  const items = all.items.filter((i) => i.dayIso === iso);
  const spans = all.spans.filter(
    (s) => index >= s.fromIndex && index <= s.toIndex,
  );

  const venues: DayVenue[] = ROOMS.flatMap((room) => {
    const onDay = [
      ...items.filter((i) => i.venueSlug === room.slug),
      ...spans.filter((s) => s.venueSlug === room.slug),
    ];
    if (onDay.length === 0) return [];
    return [
      {
        slug: room.slug,
        name: room.name,
        short: room.shortName ?? room.name,
        tier: room.tier,
        count: onDay.length,
      },
    ];
  });

  // Tight to this day's own extent. `Math.min` of an empty list is Infinity,
  // which would lay the grid out with a negative height, so an empty day
  // falls back to the afternoon the rest of the week runs in.
  // Off the morning items, which the rail carries. Counting them would put the
  // axis back at 7:00 with nothing to draw until the afternoon.
  const onAxis = items.filter((i) => !i.morning);
  const axis =
    onAxis.length === 0
      ? { startMin: 13 * 60, endMin: 18 * 60 }
      : {
          startMin:
            Math.floor(Math.min(...onAxis.map((i) => i.startMin)) / 60) * 60,
          endMin: Math.ceil(Math.max(...onAxis.map((i) => i.endMin)) / 60) * 60,
        };

  return {
    day: {
      iso,
      weekday: new Date(`${iso}T12:00:00-05:00`).toLocaleDateString("en-US", {
        timeZone: TZ,
        weekday: "long",
      }),
      label: meta.label,
    },
    venues,
    items,
    spans,
    axis,
    index,
  };
}

/** Every activation that can be exported, for the .ics route to validate against. */
export function exportableSessions(): ResolvedSession[] {
  return resolveSessions(allSessions()).filter((s) => s.when && s.page);
}

/**
 * Display strings for a confirmed slot, both derived from `when` so a change
 * to the time can't leave a stale label behind.
 */
export function whenLabels(when: { start: string; end: string }) {
  const start = new Date(when.start);
  const end = new Date(when.end);
  const date = start.toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const t = (d: Date) =>
    d
      .toLocaleTimeString("en-US", {
        timeZone: TZ,
        hour: "numeric",
        minute: "2-digit",
      })
      .replace(":00", ":00");
  return { date, time: `${t(start)} – ${t(end)}` };
}

export interface ResolvedSession extends FeaturedSession {
  venue: Room;
}

/**
 * Attach each session's venue. Entries pointing at a room that no longer
 * exists are dropped rather than rendered with a blank venue line.
 */
export function resolveSessions(
  sessions: FeaturedSession[],
): ResolvedSession[] {
  return sessions.flatMap((s) => {
    const venue = ROOMS.find((r) => r.slug === s.room);
    return venue ? [{ ...s, venue }] : [];
  });
}

export function resolveSession(
  session: FeaturedSession,
): ResolvedSession | null {
  return resolveSessions([session])[0] ?? null;
}

// ─── /schedule/[slug] ───────────────────────────────────────────────────────
//
// One namespace under /schedule, holding two kinds of page.
//
// Today every slug is a venue — /schedule/tpr is Texas Public Radio's week.
// The second kind is an activation big enough to be its own mini-conference
// inside the week (PySanAntonio is the first), which will want its own page
// rather than a card in someone else's room.
//
// They share a namespace because a reader doesn't sort them: both answer
// "what's happening at this thing". Venues resolve first, so a room slug can
// never be shadowed by an activation that happens to share its name.

/** Every session known to the site, headline included. */
export function allSessions(): FeaturedSession[] {
  return [
    HEADLINE_SESSION,
    ACCESS_GRANTED_SESSION,
    THE_MODEL_SESSION,
    ...FEATURED_SESSIONS,
  ];
}

export interface VenueSchedule {
  kind: "venue";
  room: Room;
  /** Featured activations in this room, headline first if it has one. */
  sessions: ResolvedSession[];
}

export interface ActivationSchedule {
  kind: "activation";
  session: ResolvedSession;
}

export type Schedule = VenueSchedule | ActivationSchedule;

/** Activations big enough to hold a page, keyed by the segment they answer to. */
function activations(): Map<string, FeaturedSession> {
  const m = new Map<string, FeaturedSession>();
  for (const s of allSessions()) if (s.page) m.set(s.page, s);
  return m;
}

/**
 * Slugs /schedule/[slug] builds — every room carrying at least one featured
 * session, plus every activation that has opted into a page.
 *
 * A room with an empty schedule gets nothing: no link points at it, and an
 * empty page is a worse answer than a 404.
 */
/**
 * Where a venue slug should send people instead of rendering a page.
 *
 * A room with a single activation has no week to show. /schedule/legacy-park
 * was 898 words that named Startup Bash twelve times and nothing else — a
 * second URL competing with the activation's own page for the same searches,
 * and by then nothing linked to it either.
 *
 * Derived from the room's programming rather than a hardcoded slug, so a room
 * that gains a second session stops redirecting on the next build and gets
 * its venue page back with no config to remember.
 *
 * Returns null when the room genuinely has a week worth showing, or when its
 * one activation has no page of its own to send anyone to.
 */
export function venueRedirect(slug: string): string | null {
  const room = ROOMS.find((r) => r.slug === slug);
  if (!room || room.sessions.length > 1) return null;
  const only = allSessions().find((s) => s.room === slug);
  return only?.page ? `/schedule/${only.page}` : null;
}

/**
 * Activations that have a page of their own, for the admin's picker.
 *
 * Derived rather than listed, so an activation gaining a `page` becomes
 * linkable without anyone remembering to add it here too.
 */
/**
 * The activation's own title, from its slug — for pages that hold a link to
 * one but not the activation itself, like a speaker's session list.
 */
export function activationTitle(
  slug: string | null | undefined,
): string | null {
  if (!slug) return null;
  return allSessions().find((s) => s.page === slug)?.title ?? null;
}

/** Slug and display name for every activation with a page, short name first. */
export function activationOptions(): { slug: string; title: string }[] {
  return allSessions()
    .filter((s) => s.page)
    .map((s) => ({ slug: s.page as string, title: s.shortTitle ?? s.title }));
}

export const ACTIVATION_SLUGS = allSessions()
  .filter((s) => s.page)
  .map((s) => s.page as string) as [string, ...string[]];

/**
 * Activation URLs that shipped and then moved.
 *
 * /schedule/acm-utsa was live for one deploy before the hour was reframed from
 * a chapter introduction into College Night, a social for every computing
 * student in the city. That deploy put the old URL in the sitemap, so it 308s
 * to the new one rather than 404ing.
 *
 * These have to be in `scheduleSlugs` as well as here: `dynamicParams` is
 * false on the route, so a slug with no static param never reaches the page
 * and the redirect below it never runs.
 */
export const RETIRED_PAGES: Record<string, string> = {
  "acm-utsa": "college-night",
  // Thursday's Linux afternoon shipped as /schedule/txlf for one deploy before
  // it was renamed: it runs powered by learnOPENtech, Texas Linux Fest and
  // DEVSA rather than as TXLF itself.
  txlf: "linux-satx",
};

export function scheduleSlugs(): string[] {
  const withSessions = new Set(allSessions().map((s) => s.room));
  return [
    ...ROOMS.filter((r) => withSessions.has(r.slug)).map((r) => r.slug),
    ...activations().keys(),
    ...Object.keys(RETIRED_PAGES),
  ];
}

/**
 * Resolve a /schedule/[slug] segment, or null when nothing claims it.
 *
 * Rooms resolve first, so an activation can never shadow a venue that happens
 * to share its name — the venue is the older, more linked-to URL of the two.
 */
export function resolveSchedule(slug: string): Schedule | null {
  const room = ROOMS.find((r) => r.slug === slug);
  if (room) {
    // Chronological, not declaration order. `allSessions()` returns the two
    // banded activations first because that is what /schedule wants at the top;
    // a venue page is a room's week, and a week reads by date. The Rand ran
    // PySanAntonio (Oct 2) above Access Granted (Sep 30) above The Model
    // (Sep 28) — exactly backwards.
    //
    // Anything without a confirmed slot sorts last rather than to the front,
    // which is where an empty string would have put it, and holds its relative
    // order behind the dated ones.
    const sessions = resolveSessions(
      allSessions().filter((s) => s.room === room.slug),
    ).sort((a, b) => {
      if (!a.when) return b.when ? 1 : 0;
      if (!b.when) return -1;
      return a.when.start.localeCompare(b.when.start);
    });
    return sessions.length > 0 ? { kind: "venue", room, sessions } : null;
  }

  const activation = activations().get(slug);
  if (!activation) return null;
  const session = resolveSession(activation);
  return session ? { kind: "activation", session } : null;
}
