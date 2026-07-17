import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NotFoundGame } from "@/components/site/not-found-game";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black px-6 py-16 text-center text-white">
      <Link
        href="/"
        aria-label="San Antonio Startup + Tech Week — home"
        className="opacity-80 transition-opacity hover:opacity-100"
      >
        <Image
          src="/brand/sastw-horizontal-white.png"
          alt="San Antonio Startup + Tech Week"
          width={168}
          height={42}
          priority
          className="h-9 w-auto"
        />
      </Link>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          Error 404
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-5xl">
          Signal lost.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-white/60">
          This page isn&apos;t on the grid yet — the lineup&apos;s still being
          wired. Run the bolt while you wait, or ride the current back.
        </p>
      </div>

      <NotFoundGame />

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <Link
          href="/register"
          className="inline-flex items-center gap-0.5 font-medium text-magenta hover:underline"
        >
          Register
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-0.5 text-white/60 hover:text-white"
        >
          Plug back in
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
