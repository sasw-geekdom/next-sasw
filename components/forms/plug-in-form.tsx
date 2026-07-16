"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SpeakerForm } from "@/components/forms/speaker-form";
import { VolunteerForm } from "@/components/forms/volunteer-form";
import { SponsorForm } from "@/components/forms/sponsor-form";
import { useBoltColor } from "@/components/site/bolt-color";
import { DEFAULT_CIRCUIT_COLOR } from "@/lib/tracks";

type Path = "sponsor" | "volunteer" | "speak";

const PATHS: { key: Path; label: string; blurb: string }[] = [
  { key: "sponsor", label: "Sponsor", blurb: "Power the week." },
  { key: "volunteer", label: "Volunteer", blurb: "Join the crew." },
  { key: "speak", label: "Speak", blurb: "Pitch a session." },
];

export function PlugInForm() {
  const [path, setPath] = React.useState<Path>("sponsor");
  const { setColor } = useBoltColor();

  function choose(p: Path) {
    setPath(p);
    // The bolt only tints for the speaker circuit picker; reset it otherwise.
    if (p !== "speak") setColor(DEFAULT_CIRCUIT_COLOR);
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="How do you want to plug in?"
        className="grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-muted/40 p-1.5"
      >
        {PATHS.map((p) => {
          const on = path === p.key;
          return (
            <button
              key={p.key}
              role="tab"
              aria-selected={on}
              onClick={() => choose(p.key)}
              className={cn(
                "rounded-md px-3 py-2.5 text-left transition-all",
                on
                  ? "bg-foreground text-white shadow-sm"
                  : "text-muted-foreground hover:bg-white hover:text-foreground",
              )}
            >
              <span className="block text-sm font-medium">{p.label}</span>
              <span
                className={cn(
                  "hidden text-[11px] sm:block",
                  on ? "text-magenta" : "text-muted-foreground/70",
                )}
              >
                {p.blurb}
              </span>
            </button>
          );
        })}
      </div>

      {path === "sponsor" && <SponsorForm />}
      {path === "volunteer" && <VolunteerForm />}
      {path === "speak" && <SpeakerForm />}
    </div>
  );
}
