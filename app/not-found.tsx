import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ShaderCanvas } from "@/components/site/shader-canvas";

// The bolt with no charge in it.
//
// Every other surface runs this shader live — the homepage sweeps five
// circuits through it, /sessions and /speakers each carry their own. Here it's
// the same bolt, frozen and drained of colour: the page you asked for isn't on
// the grid, and the mark says so before the copy does.
//
// `still` rather than `active={false}`: pausing bails the draw loop before its
// first frame, so the shape would come out empty rather than dead.
const DEAD = "#54525a";

// Barely above black. The flow mixes up from this floor toward the colour
// above, so a lifted floor is what makes a bolt look lit — keeping it low is
// most of why this one doesn't.
const DEAD_BASE: [number, number, number] = [0.035, 0.033, 0.04];

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black px-6 py-12 text-center text-white">
      <Link
        href="/"
        aria-label="San Antonio Startup + Tech Week — home"
        className="opacity-80 transition-opacity hover:opacity-100"
      >
        <Image
          src="/brand/sastw-horizontal-white.png"
          alt="San Antonio Startup + Tech Week"
          width={280}
          height={70}
          priority
          className="h-14 w-auto sm:h-16"
        />
      </Link>

      {/* No hover, no sweep, no cursor tracking — every interaction the live
          bolts have is deliberately absent. It's scenery, not a control. */}
      <div className="w-56 sm:w-72">
        <ShaderCanvas
          color={DEAD}
          base={DEAD_BASE}
          still
          maskClassName="bolt-mask"
          fallbackSrc="/brand/sastw-bolt.svg"
          className="aspect-square w-full"
        />
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          404 · off the grid
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-5xl">
          No current here.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-white/60">
          This one never came online. Register and we&apos;ll send the lineup
          your way the moment it does.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <Link
          href="/register"
          className="inline-flex items-center gap-0.5 font-medium text-magenta hover:underline"
        >
          Register
          <ArrowUpRight
            className="h-4 w-4"
            strokeWidth={2}
            aria-hidden="true"
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-0.5 text-white/60 hover:text-white"
        >
          Plug back in
          <ArrowUpRight
            className="h-4 w-4"
            strokeWidth={2}
            aria-hidden="true"
          />
        </Link>
      </div>
    </main>
  );
}
