import { EVENT_DAYS } from "@/lib/event";
import { ASSET, ROOMS, type Room, type RoomTier } from "@/lib/locations";
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
      people?: readonly { name: string; role: string }[];
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
  // 146 characters against Access Granted's 161 — close enough to sit level
  // beside it on /schedule/the-rand, where this once ran to five lines against
  // that one's four and made the pair look like an accident.
  //
  // Event voice, not product voice. Earlier passes borrowed sentence shapes
  // from elevenlabs.io/creative and runway.com — "turn ideas into finished
  // image, film and voice" — which is a capability promise. Those sites sell a
  // tool; this is an invitation to a room, and it cannot promise a reader an
  // outcome. So this names the two communities, the occasion, and what happens
  // in it, in that order.
  //
  // 151 characters against Access Granted's 161, close enough to sit level
  // beside it on /schedule/the-rand, where this once ran to five lines against
  // that one's four and made the pair look like an accident.
  blurb:
    "An afternoon that puts San Antonio's creative economy and the DEVSA community in one room — local makers breaking down how the work actually gets made.",
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
    // Confirmed: Monday 28 September, 5–7pm, and the only thing running at
    // Texas Public Radio that evening.
    when: {
      start: "2026-09-28T17:00:00-05:00",
      end: "2026-09-28T19:00:00-05:00",
    },
    // Nonprofit leaders, not founders. missionpitch.org describes it as "an
    // accelerator for nonprofit leaders in the greater San Antonio area", run
    // by Social Venture Partners with Geekdom, and what's awarded is
    // unrestricted grant money — the 2025 cohort took $72,855, part of it
    // raised from the room on the night. The old blurb said "founders" and
    // "capital", which described a startup demo day this isn't.
    blurb:
      "San Antonio nonprofit leaders pitch funders from the main stage — grants decided in the room.",
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
      "The weekly founder format, run at LaunchSA HQ: present, take questions, leave with answers.",
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
    // generic room given the blurb names LaunchSA HQ. Deliberately quieter
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
            },
            {
              name: "Nic McGinnis",
              role: "Family office advisor · Product design + Data + AI",
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
          body: "A hands-on session at LaunchSA on what open source actually is, how a machine gets rebuilt on it, and why a computer written off by its manufacturer is usually the fastest one somebody in the room has owned.",
          feature: true,
        },
        {
          time: "Friday, Oct 2",
          title: "Community computer giveaway",
          body: "The machines collected across the week go home with students, families and non-profits, set up and ready to use.",
          feature: true,
        },
      ],
      coda:
        "Vendor lock-in is the reason a five-year-old laptop feels slow, and open source is the reason it does not have to. Every machine that leaves this room is one that was headed for a landfill and is now somebody's first computer, running software nobody can switch off remotely.",
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
    site: { label: "aitxcommunity.com", href: "https://www.aitxcommunity.com/" },
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
      coda:
        "Texas keeps being described as an AI hub in the aggregate \u2014 the capital that landed, the companies that moved. AITX is the part of that which is a room with people in it, and the difference between a region with startups and a region with an ecosystem is whether those people ever meet.",
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
    blurb:
      "The local chapter of Google's developer community \u2014 a featured talk from Hastimal Jangid, and the room that runs it the rest of the year.",
    detail: {
      eyebrow: "The hour",
      headline: "Local chapter, open door.",
      lede: [
        "Google Developer Groups are local communities where developers build skills together, in person and online \u2014 open to anyone interested in the technology, at any level of experience.",
        "The chapter brings its featured speaker to The Rand for the hour: Hastimal Jangid, co-founder of RankRabbit AI, on cloud, data and AI engineering at platform scale.",
      ],
      coda:
        "A chapter is not a conference track. It is the same people, in the same city, month after month \u2014 which is why the useful thing this hour offers is not the talk but the group still being there in November.",
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
      coda:
        "Geekdom's pitch to founders is that people are the unfair advantage \u2014 that a hard problem gets easier with the right person across the table, and that person is hard to find on your own, so they built the room where they already are. That room is the third floor of the Rand, which is the floor you would be standing on. A student who finds it in their first semester has four years of it, and that is the whole reason the community floor gives an evening to people who cannot yet put Geekdom on a r\u00e9sum\u00e9. Nobody has to join anything to talk to anyone.",
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
      start: "2026-10-01T13:00:00-05:00",
      end: "2026-10-01T16:00:00-05:00",
    },
    // TODO(content): speakers are being announced. They belong in the sessions
    // CMS pointed at this slug — that is what links the speaker pages back, and
    // CMS rows supersede `detail` on the page.
    blurb:
      "Three hours on the community floor for the people who actually run Linux \u2014 the environment, the tooling, the config you keep tuning. Part of the week, and free with it.",
    detail: {
      eyebrow: "The afternoon",
      headline: "Linux, on purpose.",
      lede: [
        "If you run Linux you already know why. The distro you settled on, the window manager you rebuilt twice, the dotfiles you will not stop tuning \u2014 this is three hours for the part of your setup nobody at work wants to hear about.",
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
      coda:
        "Every other room this week is about something being built \u2014 a company, a pitch, a product. This one is about the thing underneath it, which is the least glamorous and most load-bearing subject on the schedule. It runs because the people behind it already do this work here, and would rather spend a Thursday on it than a slide.",
      kicker: "Bring the laptop you actually use. Opinions come standard.",
      access:
        "Free with Startup + Tech Week registration. Discount codes for November\u2019s Texas Linux Fest are being handed out in the room.",
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
    site: { label: "meetup.com/sadnug", href: "https://www.meetup.com/sadnug/" },
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
      coda:
        "Platform user groups are the least fashionable and most durable thing in a tech scene. They were meeting before the week was announced and they will be meeting after it \u2014 which is the whole argument for giving the community floor to the groups that already do the work.",
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
   * A typeset lockup the grid knows how to draw itself.
   *
   * Access Granted and The Model have no wordmark file — their marks are set
   * in type, which is exactly why the question "can the calendar use their
   * fonts" has a real answer for these two and not for the others. Same two
   * cases session-bento's `BrandLockup` special-cases, keyed the same way, on
   * `page` rather than on the title, because the title is copy.
   */
  wordmark?:
    | "the-model"
    | "access-granted"
    | "startup-bash"
    | "college-night";
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
  const wordmark =
    session.page === "access-granted" ||
    session.page === "the-model" ||
    session.page === "startup-bash" ||
    session.page === "college-night"
      ? session.page
      : undefined;
  if (!accent && !wordmark && !session.logo) return undefined;
  return {
    accent,
    wordmark,
    ink: session.page === "the-model" ? MODEL_INK : undefined,
    lockup: session.logo,
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
function calendarAxis(items: CalendarItem[]): { startMin: number; endMin: number } {
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

export function weekCalendar(): WeekCalendar {
  const resolved = resolveSessions(allSessions());

  const items: CalendarItem[] = resolved
    .filter((s) => s.when)
    .map((s) => {
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
 *  - No morning rail. The rail exists in the week view so the axis doesn't
 *    start at 7:30 AM for one brunch across five columns. A day view is the
 *    detail view and should show the day's true shape, including the fact
 *    that Thursday has a morning and an evening and nothing between them.
 *  - The axis is derived from this day alone, so a quiet day draws short.
 */
export function dayCalendar(iso: string): DayCalendar | null {
  const index = EVENT_DAYS.findIndex((d) => d.iso === iso);
  if (index === -1) return null;
  const meta = EVENT_DAYS[index];

  const all = weekCalendar();
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
  const axis =
    items.length === 0
      ? { startMin: 13 * 60, endMin: 18 * 60 }
      : {
          startMin: Math.floor(Math.min(...items.map((i) => i.startMin)) / 60) * 60,
          endMin: Math.ceil(Math.max(...items.map((i) => i.endMin)) / 60) * 60,
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
