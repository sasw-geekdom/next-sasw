// The year 11 photo recap the homepage hero scrolls — the same set, order
// and captions as the "ultimate" thank-you social video. Spotlight columns
// get a full-height card with a magenta frame; pairs stack two smaller
// photos. Captions are only what the photo itself shows (a sign, a slide, a
// banner); candid shots carry none. Files live in public/home/recap.

export interface RecapPhoto {
  src: string;
  w: number;
  h: number;
  cap: string;
  /** object-position for the crop. */
  pos: string;
}

export interface RecapColumn {
  kind: "spotlight" | "pair";
  items: RecapPhoto[];
}

export const RECAP: RecapColumn[] = [
  {
    kind: "spotlight",
    items: [
      {
        src: "/home/recap/r00.jpg",
        w: 1067,
        h: 1600,
        cap: "The Model",
        pos: "55% 45%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r01.jpg",
        w: 798,
        h: 1200,
        cap: "The Model",
        pos: "50% 55%",
      },
      {
        src: "/home/recap/r02.jpg",
        w: 1200,
        h: 960,
        cap: "Mission Pitch",
        pos: "45% 40%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r03.jpg",
        w: 784,
        h: 1200,
        cap: "",
        pos: "55% 40%",
      },
      {
        src: "/home/recap/r04.jpg",
        w: 800,
        h: 1200,
        cap: "",
        pos: "60% 30%",
      },
    ],
  },
  {
    kind: "spotlight",
    items: [
      {
        src: "/home/recap/r05.jpg",
        w: 1600,
        h: 1067,
        cap: "Startup + Tech Week",
        pos: "50% 40%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r06.jpg",
        w: 800,
        h: 1200,
        cap: "Behind the Build",
        pos: "50% 50%",
      },
      {
        src: "/home/recap/r07.jpg",
        w: 801,
        h: 1200,
        cap: "College Night",
        pos: "50% 35%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r08.jpg",
        w: 1200,
        h: 800,
        cap: "1 Million Cups",
        pos: "50% 45%",
      },
      {
        src: "/home/recap/r09.jpg",
        w: 675,
        h: 1200,
        cap: "Access Granted",
        pos: "50% 55%",
      },
    ],
  },
  {
    kind: "spotlight",
    items: [
      {
        src: "/home/recap/r10.jpg",
        w: 1069,
        h: 1600,
        cap: "The Readiness Gap",
        pos: "50% 45%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r11.jpg",
        w: 1200,
        h: 800,
        cap: "Texas Public Radio",
        pos: "45% 40%",
      },
      {
        src: "/home/recap/r12.jpg",
        w: 1200,
        h: 800,
        cap: "Texas Public Radio",
        pos: "50% 35%",
      },
    ],
  },
  {
    kind: "spotlight",
    items: [
      {
        src: "/home/recap/r13.jpg",
        w: 1600,
        h: 1069,
        cap: "The Long Haul",
        pos: "50% 50%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r14.jpg",
        w: 675,
        h: 1200,
        cap: "The LEGO session",
        pos: "50% 50%",
      },
      {
        src: "/home/recap/r15.jpg",
        w: 1200,
        h: 900,
        cap: "AWS User Group",
        pos: "50% 50%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r16.jpg",
        w: 1200,
        h: 800,
        cap: "LISC San Antonio",
        pos: "50% 40%",
      },
      {
        src: "/home/recap/r17.jpg",
        w: 1200,
        h: 800,
        cap: "",
        pos: "50% 50%",
      },
    ],
  },
  {
    kind: "spotlight",
    items: [
      {
        src: "/home/recap/r18.jpg",
        w: 1600,
        h: 1069,
        cap: "Pre-Seed in the Age of AI",
        pos: "50% 50%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r19.jpg",
        w: 1200,
        h: 800,
        cap: "Texas Public Radio",
        pos: "40% 40%",
      },
      {
        src: "/home/recap/r20.jpg",
        w: 1200,
        h: 800,
        cap: "Texas Public Radio",
        pos: "35% 40%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r21.jpg",
        w: 1200,
        h: 800,
        cap: "",
        pos: "50% 40%",
      },
      {
        src: "/home/recap/r22.jpg",
        w: 801,
        h: 1200,
        cap: "",
        pos: "50% 30%",
      },
    ],
  },
  {
    kind: "spotlight",
    items: [
      {
        src: "/home/recap/r23.jpg",
        w: 1067,
        h: 1600,
        cap: "Give-a-LOT",
        pos: "50% 35%",
      },
    ],
  },
  {
    kind: "pair",
    items: [
      {
        src: "/home/recap/r24.jpg",
        w: 1200,
        h: 800,
        cap: "Give-a-LOT",
        pos: "50% 45%",
      },
      {
        src: "/home/recap/r25.jpg",
        w: 1200,
        h: 800,
        cap: "PySanAntonio II",
        pos: "50% 50%",
      },
    ],
  },
  {
    kind: "spotlight",
    items: [
      {
        src: "/home/recap/r26.jpg",
        w: 1067,
        h: 1600,
        cap: "Startup + Tech Week",
        pos: "50% 45%",
      },
    ],
  },
];
