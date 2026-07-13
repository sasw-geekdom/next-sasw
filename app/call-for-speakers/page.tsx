import type { Metadata } from "next";
import { SpeakerForm } from "@/components/forms/speaker-form";

export const metadata: Metadata = {
  title: "Call for Speakers",
  description: "Pitch a session for San Antonio Startup + Tech Week.",
};

export default function CallForSpeakersPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-magenta">
        Call for Speakers
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold leading-none text-foreground sm:text-5xl">
        Take the stage.
      </h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        Sept 28 – Oct 2, downtown at TPR. Pitch a session. Name the room you want
        to be in.
      </p>

      <div className="mt-10">
        <SpeakerForm />
      </div>
    </main>
  );
}
