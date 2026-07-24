import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NotFoundGame } from "@/components/site/not-found-game";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 py-8 text-center text-white">
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

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">
          404 · off the grid
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-5xl">
          Coming online.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-white/60">
          The lineup comes online soon. Register and we&apos;ll send it your way
          the moment it&apos;s live — run the bolt while you wait.
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
