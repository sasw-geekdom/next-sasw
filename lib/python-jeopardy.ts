/**
 * Python Jeopardy — the closing social at PySanAntonio II (Fri, Oct 2).
 *
 * One host on a mic makes open calls; whoever has the mic picks a category
 * and a value, gets the first shot, and anyone can steal a miss. Daily
 * Doubles are the picker's alone. No scoreboard: it is an open room with no
 * teams, and the point is a laugh to end five days of DEVSA events, so
 * light over hard.
 *
 * Two rounds, like the show: Jeopardy, then Double Jeopardy at twice the
 * values: round one is easy and entertaining, round two is Python across
 * industries.
 *
 * Jeopardy's way round: the board shows a statement and the reply is a
 * question, so the reveal reads "What is Pygame?". `ask` is the front of
 * that question ("What is" unless set). The room is not held to the form.
 */

export interface JeopardyClue {
  q: string;
  a: string;
  /** The front of the reply, "What is" unless set. */
  ask?: string;
  /** Set the answer in monospace — it is code or output. */
  mono?: boolean;
}

export interface JeopardyCategory {
  name: string;
  clues: readonly JeopardyClue[];
}

export interface JeopardyRound {
  name: string;
  values: readonly number[];
  /** How many Daily Doubles hide on this board. The show runs one, then two. */
  dailyDoubles: number;
  categories: readonly JeopardyCategory[];
}

// ─── Round one: easy, and entertainment ──────────────────────────────────────
//
// Things anyone in the room can answer, and a host who doesn't write Python
// can read without tripping.

const ROUND_ONE: readonly JeopardyCategory[] = [
  {
    name: "Snakes on a Plane",
    clues: [
      {
        q: "In 2006, this actor had had it with these snakes on this plane.",
        a: "Samuel L. Jackson",
        ask: "Who is",
      },
      {
        q: 'Every plane has a black box. Every tidy Python project runs this formatter, which calls itself "uncompromising."',
        a: "Black",
      },
      {
        q: "Despite its name, this Python workflow scheduler from Airbnb has never flown anything.",
        a: "Apache Airflow",
      },
      {
        q: "In xkcd's \"Python\" comic, a stick figure takes off after typing this one line.",
        a: "import antigravity",
        mono: true,
      },
      {
        q: "Python 3.13 added an experimental compiler with this three-letter name, which sounds like it should have wings.",
        a: "a JIT",
      },
    ],
  },
  {
    name: "Press Start to import",
    clues: [
      {
        q: "Since 2000, this Python library has been many coders' first game engine, and its name says exactly what it's for.",
        a: "Pygame",
      },
      {
        q: "Modders of this life simulation series write their mods in Python, no cheat codes required.",
        a: "The Sims",
      },
      {
        q: "Doki Doki Literature Club was built with this Python visual novel engine.",
        a: "Ren'Py",
      },
      {
        q: "Sid Meier's 2005 strategy game, the fourth in its series, let players rewrite the rules in Python. Just one more turn.",
        a: "Civilization IV",
      },
      {
        q: "This spaceship MMO, where every player shares one giant universe, runs its servers on Stackless Python.",
        a: "EVE Online",
      },
    ],
  },
  {
    name: "Easy as Pi",
    clues: [
      {
        q: 'The "Pi" in this credit-card-sized computer originally came from Python.',
        a: "Raspberry Pi",
      },
      {
        q: "This beginner Python editor comes preinstalled on Raspberry Pi OS.",
        a: "Thonny",
      },
      {
        q: "This Python library makes blinking an LED from a Pi's pins about two lines of code.",
        a: "GPIO Zero",
      },
      {
        q: "The Pi got its own edition of this block-building game, with a Python API for building with code.",
        a: "Minecraft",
      },
      {
        q: "Through the Astro Pi program, students' Python code runs on Raspberry Pis aboard this.",
        a: "the International Space Station",
      },
    ],
  },
  {
    name: "Deep in the Heart of Python",
    clues: [
      {
        q: "Texas has rattlesnakes, copperheads and coral snakes, but none of these in the wild. And the language isn't even named after them.",
        a: "pythons",
        ask: "What are",
      },
      {
        q: 'The Alamo fell in 1836. Python 3.6 brought us these, so you can write f"Remember the {place}".',
        a: "f-strings",
        ask: "What are",
      },
      {
        q: "Ask Python's zoneinfo for San Antonio's time zone and you'll type the name of this other city.",
        a: "Chicago",
      },
      {
        q: "SpaceX builds and launches Starship from this South Texas spot, which voted to become an official city in 2025.",
        a: "Starbase",
      },
      {
        q: "This San Antonio company co-founded OpenStack with NASA in 2010, and OpenStack is written largely in Python.",
        a: "Rackspace",
      },
    ],
  },
  {
    // From the Python community, as sent.
    name: "Django Unchained",
    clues: [
      {
        q: "Django is named after Django Reinhardt, a world-famous legendary musician who played this style of guitar.",
        a: "jazz (or gypsy jazz)",
      },
      {
        q: "In Django web development, the acronym ORM stands for this technique that translates database tables into Python objects.",
        a: "Object-Relational Mapping",
      },
      {
        q: "This 2012 Quentin Tarantino film starring Jamie Foxx shares the category's exact name.",
        a: "Django Unchained",
      },
      {
        q: 'Instead of the traditional MVC (Model-View-Controller) architecture, Django describes its pattern as MVT, where "T" stands for this.',
        a: "Template",
      },
      {
        q: "Django comes with a built-in, out-of-the-box user interface for managing site content, accessible by default at /admin.",
        a: "the Django Admin Panel",
      },
    ],
  },
  {
    name: "Full-Court Py",
    clues: [
      {
        q: "Python counts from 0, so the Spurs' Victor Wembanyama wears what Python would call the second number.",
        a: "1",
      },
      {
        q: "Moneyball made baseball stats famous. This Python package, named for the sport, pulls MLB's Statcast data.",
        a: "pybaseball",
      },
      {
        q: "This unofficial Python package pulls stats straight from NBA.com, Spurs included.",
        a: "nba_api",
        mono: true,
      },
      {
        q: "Formula 1 fans dig into race telemetry with this Python package. Handy for the U.S. Grand Prix in Austin.",
        a: "FastF1",
      },
      {
        q: "Soccer analysts load this company's free match data into Python with a package that starts with its name.",
        a: "StatsBomb",
      },
    ],
  },
];

// ─── Round two: Double Jeopardy, Python across industries ─────────────────────
//
// One field per column, and how Python runs through it.

const ROUND_TWO: readonly JeopardyCategory[] = [
  {
    name: "Lights, Camera, import",
    clues: [
      {
        q: "Python is named after this British comedy troupe, not the snake.",
        a: "Monty Python",
        ask: "Who is",
      },
      {
        q: "This free 3D suite, behind a lot of indie animation, lets you script everything in Python through a module called bpy.",
        a: "Blender",
      },
      {
        q: "Besides Python, Autodesk Maya has its own scripting language, known by these three letters.",
        a: "MEL",
      },
      {
        q: "George Lucas's visual effects house has run Python in its pipeline since the 1990s. So yes, there was Python in a galaxy far, far away.",
        a: "Industrial Light & Magic (ILM)",
      },
      {
        q: "Pixar open-sourced this three-letter scene format, now a film industry standard with Python bindings.",
        a: "USD",
      },
    ],
  },
  {
    name: "Houston, We Have a Python",
    clues: [
      {
        q: "Named for the study of the stars, this Python package is the core library for astronomy.",
        a: "Astropy",
      },
      {
        q: "In 2021, GitHub gave a badge to open-source contributors, Python and NumPy among them, for helping this Mars helicopter fly.",
        a: "Ingenuity",
      },
      {
        q: "In 2019 the Event Horizon Telescope revealed the first-ever image of one of these, with help from NumPy and Matplotlib.",
        a: "a black hole",
      },
      {
        q: "Launched on Christmas Day 2021, this space telescope sends its data through a calibration pipeline written in Python.",
        a: "the James Webb Space Telescope",
      },
      {
        q: "LIGO's 2015 detection of these ripples in spacetime, predicted by Einstein a century earlier, was analyzed with Python tools.",
        a: "gravitational waves",
        ask: "What are",
      },
    ],
  },
  {
    name: "Of the People, By the Python",
    clues: [
      {
        q: "The Python Software Foundation holds this IRS tax status, the same as most charities.",
        a: "501(c)(3)",
      },
      {
        q: "Data.gov, the federal open data catalog, runs on CKAN, an open-source platform written in this language. Hint: look around the room.",
        a: "Python",
      },
      {
        q: 'In 2022, the NSA listed Python among these "safe" languages, alongside Rust, Go and Java.',
        a: "memory-safe languages",
        ask: "What are",
      },
      {
        q: "The NSA open-sourced this reverse engineering tool in 2019, and you can script it in Python.",
        a: "Ghidra",
      },
      {
        q: "Lawrence Livermore National Laboratory built Spack, a Python package manager for these giant government computers.",
        a: "supercomputers",
        ask: "What are",
      },
    ],
  },
  {
    name: "import AI",
    clues: [
      {
        q: "Named after a yellow emoji giving a hug, this company hosts hundreds of thousands of open-source AI models and datasets.",
        a: "Hugging Face",
      },
      {
        q: "This deep learning library that came out of Meta shares its name with something you'd carry in a night parade.",
        a: "PyTorch",
      },
      {
        q: "This Python framework chains prompts, tools and LLM calls together, and says so in its name.",
        a: "LangChain",
      },
      {
        q: "This open-source OpenAI speech recognition model shares its name with a secret told in someone's ear.",
        a: "Whisper",
      },
      {
        q: 'The "T" in GPT stands for this neural network architecture, introduced by Google researchers in 2017.',
        a: "Transformer",
      },
    ],
  },
  {
    // After Styx's "Mr. Roboto".
    name: "Domo Arigato, Mr. Python",
    clues: [
      {
        q: "This lean version of Python runs on tiny microcontrollers, and started life as a 2013 Kickstarter.",
        a: "MicroPython",
      },
      {
        q: "Kids can program this toy company's SPIKE Prime robots in Python, and Thursday's workshop at Geekdom used its bricks too.",
        a: "LEGO",
      },
      {
        q: "Boston Dynamics' robot dog has a Python SDK. Name the dog.",
        a: "Spot",
      },
      {
        q: "Robots everywhere run on ROS, which you can program in Python. The letters stand for this.",
        a: "the Robot Operating System",
      },
      {
        q: "Adafruit's beginner-friendly spin on MicroPython, made for blinking LEDs and building robots.",
        a: "CircuitPython",
      },
    ],
  },
  {
    // Cybersecurity, in the city that calls itself Cyber City, USA.
    name: "import secrets",
    clues: [
      {
        q: "This xkcd kid's full name is Robert'); DROP TABLE Students;-- and he's why you use parameterized queries. His mom calls him this.",
        a: "Little Bobby Tables",
        ask: "Who is",
      },
      {
        q: "Since Python 3.6, use this standard library module, not random, for passwords and tokens. It's also this category's name.",
        a: "secrets",
      },
      {
        q: "This built-in runs any string as Python code, which is why it should never see user input.",
        a: "eval",
      },
      {
        q: 'Uploading a malicious package to PyPI named "reqeusts," one typo away from the real one, is called this.',
        a: "typosquatting",
      },
      {
        q: "This Python memory forensics framework shares its name with a word for how jumpy the stock market is.",
        a: "Volatility",
      },
    ],
  },
];

export const JEOPARDY_ROUNDS: readonly JeopardyRound[] = [
  {
    name: "Jeopardy",
    values: [200, 400, 600, 800, 1000],
    dailyDoubles: 1,
    categories: ROUND_ONE,
  },
  {
    name: "Double Jeopardy",
    values: [400, 800, 1200, 1600, 2000],
    dailyDoubles: 2,
    categories: ROUND_TWO,
  },
];

export const JEOPARDY_FINAL = {
  name: "The Zen of Python",
  q: "The Zen of Python says there should be one obvious way to do it, then admits that way may not be obvious at first unless you are this nationality.",
  a: "Dutch",
  ask: "What is",
} as const;
