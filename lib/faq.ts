/**
 * The one-pager: badges, parking, rooms.
 *
 * Everything an attendee asks before the week that is not on the schedule.
 * Kept here rather than in the page for the reason the footer keeps its room
 * list in `ROOMS`: the answers are data, two surfaces read them (the page and
 * its FAQPage structured data), and an answer that exists twice drifts.
 *
 * Answers are plain strings on purpose. They are rendered as copy and handed
 * to Google as `acceptedAnswer.text`, and markup in the second one is a
 * validation warning rather than a formatted answer. Where an answer wants a
 * link, the page puts it beside the text — see `link` below.
 */

/** A question and its answer, as both are published. */
export interface FaqItem {
  q: string;
  /** One or more paragraphs. Plain text — see the note above. */
  a: string[];
  /** An optional action beside the answer. */
  link?: { label: string; href: string };
}

export interface FaqSection {
  id: string;
  eyebrow: string;
  headline: string;
  /**
   * The answer before the questions, where a section has one sentence that
   * settles most of them. Parking does: almost everybody arriving at that
   * heading wants a number, and making them read four questions to find it is
   * the failure an FAQ page usually is.
   */
  lead?: string;
  items: FaqItem[];
}

/**
 * Where a badge is handed over.
 *
 * Three of the six rooms, which is the organisers' call rather than a
 * property of the venues: Geekdom staff run the desks, and these are the
 * three buildings they are in all week. Addresses come from `ROOMS` at the
 * point of use rather than being retyped here — this list is the three slugs
 * and what the desk is for.
 */
export const BADGE_DESKS: { room: string; note: string }[] = [
  { room: "tpr", note: "The anchor room, and the busiest desk." },
  { room: "the-rand", note: "Third floor, where the community hours run." },
  { room: "central-library", note: "Launch SA's floor, inside the library." },
];

/**
 * The garages, with what each one costs and where it is.
 *
 * Addresses are the City's own, corroborated twice: Centro San Antonio's
 * parking directory and the City of San Antonio Parking's own posts agree on
 * all three. The City writes them "City Tower Garage", "Houston St. Garage"
 * and "St. Mary St. Garage"; the longer forms here are what people say.
 *
 * Rates come from two places and neither is us. The $10 day is the City's flat
 * rate at its garages; the evening and weekend $5 at St. Mary's, the $15 event
 * rate and Downtown Thursday are on SAPark's affordable parking page, which is
 * what each of the three links to. The library's garage is not a SAPark
 * facility and its terms are the library's own, so it links there instead.
 *
 * Rates move. The links are the point: they go to the page that is right on
 * the day rather than to a number this file remembers.
 *
 * Coordinates are what the map draws — see lib/downtown-map. Walking times in
 * `serves` are measured from them: straight-line distance to each venue's
 * coordinates in lib/locations.ts, times 1.25 for the way downtown blocks
 * bend, at 80 m a minute, and rounded to the phrase rather than the minute.
 */
export const SAPARK_AFFORDABLE =
  "https://sapark.sanantonio.gov/Parking-Locations/Affordable-Parking";

export interface Garage {
  name: string;
  address: string;
  /** The money, in the fewest words that are still true. */
  rate: string;
  /** Which of the week's rooms this one actually serves. */
  serves: string;
  /** The page that holds the current terms. */
  href: string;
  lat: number;
  lon: number;
}

export const GARAGES: Garage[] = [
  {
    name: "City Tower Garage",
    address: "60 N Flores St",
    rate: "$10 flat, all day",
    serves:
      "A minute from The Rand and Legacy Park, about five from Texas Public Radio \u2014 the closest garage to three of the six rooms.",
    href: SAPARK_AFFORDABLE,
    lat: 29.426224,
    lon: -98.494158,
  },
  {
    name: "St. Mary's Garage",
    address: "205 E Travis St",
    rate: "$10 flat \u00b7 $5 after 5 PM and at weekends",
    serves:
      "About four minutes from The Rand, and the nearest of the three to Central Library at roughly nine.",
    href: SAPARK_AFFORDABLE,
    lat: 29.42763,
    lon: -98.491139,
  },
  {
    name: "Houston Street Garage",
    address: "111 College St",
    rate: "$10 flat, all day",
    serves:
      "About four minutes from The Rand and nine from Texas Public Radio, coming at the block from the river side.",
    href: SAPARK_AFFORDABLE,
    lat: 29.425947,
    lon: -98.491052,
  },
  {
    name: "Library Garage",
    address: "600 Soledad St",
    rate: "3 hours free with validation, then $5 flat",
    serves:
      "Under Central Library itself, entrance on Soledad. The cheapest parking of the week if your morning is at Launch SA \u2014 and a long walk from everything else.",
    href: "https://mysapl.org/Visit/Locations/Central-Library",
    // The entrance, not the building. The library's own page puts the garage
    // "directly south of the Library" with the entrance on Soledad, which is
    // 55 m south of the coordinate 600 Soledad St geocodes to — and that
    // coordinate is the library's own, so a pin on it sits underneath the
    // badge desk's.
    lat: 29.431889,
    lon: -98.492835,
  },
];

/**
 * The sections, in the order somebody needs them: get in, park, find the room,
 * then the week itself.
 *
 * Every fact here is sourced. The badge desks and who staffs them are the
 * organisers'; the meter rules, the rate and the payment methods are the
 * City's own published parking FAQ; the access rules are the `access` lines
 * already on the activations in lib/schedule.ts, summarised rather than
 * copied, because those move and this page must not become a second copy of
 * them that disagrees.
 */
export const FAQ: FaqSection[] = [
  {
    id: "badges",
    eyebrow: "Badges",
    headline: "Three desks. Bring your name.",
    items: [
      {
        q: "Where do I pick up my badge?",
        a: [
          "Texas Public Radio, The Rand and Central Library. Geekdom staff run all three desks — they check you in and hand you the badge on the spot.",
          "Pick up at whichever one you reach first. A badge from any desk works in every room all week.",
        ],
      },
      {
        q: "Do I need to print anything, or show a QR code?",
        a: [
          "No. Check-in is by name. Give the desk the name you registered under and they will find you.",
        ],
      },
      {
        q: "I haven't registered. Can I still turn up?",
        a: [
          "Yes — the desks can add you at the door. Registering first is free and makes the queue shorter for everyone behind you.",
        ],
        link: { label: "Register", href: "/register" },
      },
      {
        q: "Does my badge open every room?",
        a: [
          "Most of them. A handful of activations are seated by the organization running them rather than by the week: Trinity's Stumberg competition is ticketed on Eventbrite, the Alamo Angels brunch is by invitation, and several rooms hold their own list because the room has a count.",
          "Every activation page carries its own access line. Check the one you are heading to before you go.",
        ],
        link: { label: "The schedule", href: "/schedule" },
      },
    ],
  },
  {
    id: "parking",
    eyebrow: "Parking",
    lead: "Ten dollars flat, all day, at any City garage. Three hours free under the library. The street is the SAPark app.",
    headline: "Park once. Walk the rest.",
    items: [
      {
        q: "What does a garage cost?",
        a: [
          "$10 flat for the day at the City's garages \u2014 City Tower, St. Mary's and Houston Street \u2014 with no hourly maths to do. St. Mary's drops to $5 after 5 PM on weeknights and all weekend, and goes to $15 on the days something big is on downtown.",
          "Central Library's own garage is the cheapest of the four: the first three hours are free with validation, then $5 flat for the day. Validate at the kiosk on the entry level. It opens 7:30 AM and closes 10:30 PM, and it takes cards only.",
        ],
        link: { label: "Rates and programs", href: SAPARK_AFFORDABLE },
      },
      {
        q: "Anything free?",
        a: [
          "Thursday evening. The City runs Downtown Thursday through the end of 2026 \u2014 free parking at its own garages from 5 PM to 2 AM \u2014 which covers the whole of the Startup Bash on October 1.",
        ],
        link: { label: "Downtown Thursday", href: SAPARK_AFFORDABLE },
      },
      {
        q: "Can I park on the street?",
        a: [
          "Yes, and pay for it in the SAPark app rather than at the meter \u2014 it takes the space number, warns you before the session runs out and extends it without a walk back to the car.",
          "Meters are $1.80 an hour, enforced Monday to Saturday from 8 AM to 6 PM, and free after 6 PM and all day Sunday. The meters and pay stations themselves take cards only, never cash.",
        ],
        link: { label: "SAPark", href: "https://sapark.sanantonio.gov/" },
      },
      {
        q: "What about Trinity, for the Stumberg final?",
        a: [
          "Three miles north of downtown, and the one room with its own free lot: Alamo Stadium, a short walk from the recital hall.",
        ],
      },
    ],
  },
  {
    id: "week",
    eyebrow: "The week",
    headline: "Five days, six rooms.",
    items: [
      {
        q: "When and where is it?",
        a: [
          "Monday 28 September to Friday 2 October 2026, across six rooms in San Antonio — five of them downtown and Trinity University three miles north.",
        ],
        link: { label: "The schedule", href: "/schedule" },
      },
      {
        q: "What does it cost?",
        a: [
          "Registration is free. A few rooms run by other organizations have their own conditions, and each says so on its own page.",
        ],
        link: { label: "Register", href: "/register" },
      },
      {
        q: "How do I plan a day?",
        a: [
          "Every day has its own page with the running order, and every activation page has an add-to-calendar button that hands you the hour with the room and the address already in it.",
        ],
        link: { label: "The schedule", href: "/schedule" },
      },
      {
        q: "I have an access need, or a question this page doesn't answer.",
        a: [
          "Ask. The same form reaches the organizers whether you are asking about a room, a ramp or a sponsorship, and a person reads every one.",
        ],
        link: { label: "Ask a question", href: "/get-involved" },
      },
    ],
  },
];
