import { EVENT_DAYS } from "@/lib/event";
import { ASSET, ROOMS, type Room } from "@/lib/locations";
import { PYSA } from "@/lib/pysa";
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
    // Doors 7:30, programme through 11:00, per the organisers. This ran
    // 9:00–12:00 on the old listing.
    when: {
      start: "2026-10-01T07:30:00-05:00",
      end: "2026-10-01T11:00:00-05:00",
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
          title: "Doors",
          body: "Pulp Coffee\u2019s mobile espresso experience, brunch service, and DJ Novasoul setting the tone inside and out on the rooftop patio.",
        },
        {
          time: "8:45 \u2013 9:30",
          title: "The Fifth Degree Live",
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
          title: "The Down Market Conversation",
          feature: true,
          people: [
            { name: "Daniel Trevino", role: "Maitre" },
            { name: "Ben Hodge", role: "EEVET" },
          ],
          body: "Madison King talks with two builders solving real problems for real places \u2014 Maitre, built to help restaurants open smarter and last longer, and EEVET, built to help venues, artists and promoters book better. Different rooms, same mission: giving creative businesses the information they\u2019ve always deserved.",
        },
        {
          time: "10:30",
          title: "A special announcement",
          body: "From The Creative Futures, before the morning closes. You\u2019ll want to be in the room for this one.",
        },
        {
          time: "10:35",
          title: "The coffeehouse set",
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
      src: "/activations/creative-futures-conversation.jpg",
      width: 1500,
      height: 1613,
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
  return [HEADLINE_SESSION, ACCESS_GRANTED_SESSION, ...FEATURED_SESSIONS];
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

export function activationOptions(): { slug: string; title: string }[] {
  return allSessions()
    .filter((s) => s.page)
    .map((s) => ({ slug: s.page as string, title: s.title }));
}

export const ACTIVATION_SLUGS = allSessions()
  .filter((s) => s.page)
  .map((s) => s.page as string) as [string, ...string[]];

export function scheduleSlugs(): string[] {
  const withSessions = new Set(allSessions().map((s) => s.room));
  return [
    ...ROOMS.filter((r) => withSessions.has(r.slug)).map((r) => r.slug),
    ...activations().keys(),
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
    const sessions = resolveSessions(
      allSessions().filter((s) => s.room === room.slug),
    );
    return sessions.length > 0 ? { kind: "venue", room, sessions } : null;
  }

  const activation = activations().get(slug);
  if (!activation) return null;
  const session = resolveSession(activation);
  return session ? { kind: "activation", session } : null;
}
