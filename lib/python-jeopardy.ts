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
 * industries plus a category straight from python.org.
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
    name: "Python After Dark",
    clues: [
      {
        q: "It's 2 a.m. and nobody's awake to help, so developers explain their code out loud to this bath toy.",
        a: "a rubber duck",
      },
      {
        q: "Write while True: and forget the break, and you've made this kind of loop. It'll keep everyone up all night.",
        a: "an infinite loop",
      },
      {
        q: "Python's time module has this function for when your code needs a nap.",
        a: "sleep",
      },
      {
        q: "Background threads in Python, and processes that run all night on servers, are named after these supernatural spirits.",
        a: "daemons",
        ask: "What are",
      },
      {
        q: "A process that has finished but whose parent never checked on it lingers as this undead thing.",
        a: "a zombie",
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
        q: "Wrap this beaver-branded Texas road-trip stop's name in single quotes in Python, and its apostrophe ends the string early.",
        a: "Buc-ee's",
      },
      {
        q: "Python's logo is blue and yellow. This burger chain, founded in Corpus Christi and now headquartered in San Antonio, sticks with orange and white.",
        a: "Whataburger",
      },
      {
        q: "This San Antonio grocery chain sponsored the first PySanAntonio, and one of its staff engineers is on today's lineup talking Python and test-driven development.",
        a: "H-E-B",
      },
      {
        q: "SpaceX builds and launches Starship from Starbase, just down the road from this Rio Grande Valley city.",
        a: "Brownsville",
      },
      {
        q: "This San Antonio company co-founded OpenStack with NASA in 2010, and OpenStack is written largely in Python.",
        a: "Rackspace",
      },
    ],
  },
  {
    // Django, from the community's set plus djangoproject.com. The name is
    // the Django FAQ's own: "Django is pronounced JANG-oh... The 'D' is
    // silent."
    name: "The D Is Silent",
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
        q: 'Instead of the traditional MVC (Model-View-Controller) architecture, Django describes its pattern as MVT, where "T" stands for this.',
        a: "Template",
      },
      {
        q: "In 2003, Django's creators Adrian Holovaty and Simon Willison ditched this language for Python.",
        a: "PHP",
      },
      {
        q: "Django went open source in the summer of this year, which makes it 21 this fall.",
        a: "2005",
      },
    ],
  },
  {
    name: "Python Book Club",
    clues: [
      {
        q: "O'Reilly programming books are famous for putting one of these on the cover.",
        a: "an animal",
      },
      {
        q: "Al Sweigart's best-seller promises Python can take over the dull parts of your job.",
        a: "Automate the Boring Stuff with Python",
      },
      {
        q: "Zed Shaw's book admits up front, right in the title, that this won't be easy.",
        a: "Learn Python the Hard Way",
      },
      {
        q: "The Hitchhiker's Guide to Python borrows its title from Douglas Adams, whose answer to life, the universe and everything is this number.",
        a: "42",
      },
      {
        q: "Luciano Ramalho's O'Reilly book teaches Python the idiomatic way. Its title is how you'd describe speaking a language like a native.",
        a: "Fluent Python",
      },
    ],
  },
];

// ─── Round two: Double Jeopardy, Python across industries ─────────────────────
//
// One field per column and how Python runs through it, plus python.org's own.

const ROUND_TWO: readonly JeopardyCategory[] = [
  {
    // Everything here is from python.org and its official FAQ.
    name: "Straight From python.org",
    clues: [
      {
        q: "Python's interactive prompt, all over python.org, is this many greater-than signs.",
        a: "three",
      },
      {
        q: 'Python\'s official FAQ asks, "Do I have to like Monty Python\'s Flying Circus?" Its answer: "No, but" this.',
        a: '"it helps"',
      },
      {
        q: "Guido wanted a name that was short, unique and slightly this, so he picked Python.",
        a: "mysterious",
      },
      {
        q: "The Python Software Foundation produces this conference, the biggest yearly gathering of Python people.",
        a: "PyCon US",
      },
      {
        q: "Python's indentation came from this language Guido worked on in Amsterdam, named for the first letters of the alphabet.",
        a: "ABC",
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
    // Finance: Python on Wall Street and in the banks.
    name: "Follow the Money",
    clues: [
      {
        q: "This Python library pulls stock prices from Yahoo Finance, and its name says so.",
        a: "yfinance",
      },
      {
        q: "Wes McKinney built this Python data library in 2008 while working at a hedge fund.",
        a: "pandas",
      },
      {
        q: "Python's built-in module for exact money math, so 0.1 plus 0.2 really comes out to 0.3.",
        a: "decimal",
        mono: true,
      },
      {
        q: "JPMorgan's trading and risk platform, built largely in Python, is named after this Greek goddess of wisdom.",
        a: "Athena",
      },
      {
        q: "Bank of America's Python platform shares its name with this mineral that keeps time in most watches.",
        a: "Quartz",
      },
    ],
  },
  {
    // Cybersecurity, under the nickname San Antonio gives itself for it.
    name: "Cyber City, USA",
    clues: [
      {
        q: "This xkcd kid's full name is Robert'); DROP TABLE Students;-- and he's why you use parameterized queries. His mom calls him this.",
        a: "Little Bobby Tables",
        ask: "Who is",
      },
      {
        q: "Since Python 3.6, use this standard library module, not random, for passwords and tokens. Its name is what you're keeping.",
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
