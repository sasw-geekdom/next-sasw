import Image from "next/image";
import Link from "next/link";

// The schedule hero after the week: a thank-you over the room itself, where
// "Start ⚡ Here." used to send people into five days that have now run.
// SessionsHero (schedule-hero.tsx) is the pre-week version and still in the
// tree; swap it back in app/(site)/schedule/page.tsx for next year.
//
// No featured lineup: it existed to send people to sponsored talks still
// ahead, and after the week every one of them is in the calendar below.

// Black for the copy on the left, the photo as its own panel on the right.
// The panel takes the photo's own shape, so nothing is cropped. No dimmed
// backdrop behind it: that is what turned earlier left fades into a grey band.
// Cropped at the source to open on the two women at the table: the original
// frame cuts through a standing man at its left edge, so he is left out
// entirely rather than shown as half a person. Faded only at the foot.
// Eased in from the left over the first quarter (stops on a curve rather than
// one straight ramp), straight into solid black — no backdrop behind it, which
// is what turned earlier fades into a grey band — and out at the foot over
// nearly half the height, so it settles into the calendar's black below.
const FOOT =
  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.06) 3%, rgba(0,0,0,0.2) 7%, rgba(0,0,0,0.42) 11%, rgba(0,0,0,0.66) 15%, rgba(0,0,0,0.85) 19%, rgba(0,0,0,0.96) 23%, black 27%, black 100%), " +
  "linear-gradient(to bottom, black 0%, black 52%, rgba(0,0,0,0.94) 60%, rgba(0,0,0,0.8) 68%, rgba(0,0,0,0.6) 76%, rgba(0,0,0,0.38) 84%, rgba(0,0,0,0.18) 91%, rgba(0,0,0,0.05) 97%, transparent 100%)";

export function ScheduleThanksHero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      {/* Hidden from lg, so its size hint says so: a 1px slot from 1024px
          means a laptop never downloads the phone crop at full width. */}
      {/* Phone: the photo first, as its own block, faded into the copy. */}
      <div className="relative aspect-[4/3] w-full lg:hidden">
        <Image
          src="/schedule/thank-you-four.jpg"
          alt="Attendees leaning in under magenta light at The Rand during San Antonio Startup + Tech Week"
          fill
          priority
          sizes="(min-width: 1024px) 1px, 100vw"
          className="object-cover object-[60%_30%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,#000_0%,rgba(0,0,0,0.85)_12%,rgba(0,0,0,0.5)_28%,rgba(0,0,0,0.18)_45%,transparent_60%)]"
        />
      </div>

      {/* Laptop and up: the photo as the right panel, full height. */}
      <div
        aria-hidden="true"
        // Wider than the photo's own shape (1400×2196): the top quarter is
        // windows above everyone's heads, so the panel trims it and gains a
        // third in width, closing the gap to the copy. Anchored low so the
        // shoes stay in frame.
        className="absolute inset-y-0 right-0 -z-10 hidden aspect-[1400/1650] max-w-[55%] lg:block"
        style={{ maskImage: FOOT, WebkitMaskImage: FOOT, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        <Image
          src="/schedule/thank-you-four.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover object-[50%_88%]"
        />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 lg:min-h-[calc(100svh-4rem)]">
        <div className="flex flex-1 flex-col justify-center pb-16 pt-2 lg:max-w-[48%] lg:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            The schedule &middot; Sept 28 &ndash; Oct 2
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold uppercase leading-[0.92] tracking-tight text-balance sm:text-7xl lg:text-8xl">
            Thanks for <span className="text-magenta">plugging in.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg text-white/80">
            Founders, builders, students and first-timers filled every room. The schedule stays
            up below as a record of the week.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="#the-week"
              className="inline-flex h-13 items-center rounded-md bg-magenta px-7 text-lg font-medium text-white transition-colors hover:bg-magenta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Look back at the week.
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
