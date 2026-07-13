import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-3xl">
        <p className="font-mono text-sm uppercase tracking-widest text-magenta">
          Year 11 · Sept 28 – Oct 2
        </p>

        <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-title">
          The current runs
          <br />
          through SA.
        </h1>

        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          San Antonio Startup + Tech Week. Downtown at TPR. Plug in.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg">Plug in</Button>
          <Button size="lg" variant="outline">
            See the schedule
          </Button>
        </div>
      </div>
    </main>
  );
}
