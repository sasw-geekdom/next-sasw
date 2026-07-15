"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SpeakerForm } from "@/components/forms/speaker-form";
import { VolunteerForm } from "@/components/forms/volunteer-form";
import { SponsorForm } from "@/components/forms/sponsor-form";
import { useBoltColor } from "@/components/site/bolt-color";
import { DEFAULT_CIRCUIT_COLOR } from "@/lib/tracks";

type Path = "speak" | "volunteer" | "sponsor";

const PATHS: { key: Path; label: string; blurb: string }[] = [
  { key: "speak", label: "Speak", blurb: "Pitch a session." },
  { key: "volunteer", label: "Volunteer", blurb: "Join the crew." },
  { key: "sponsor", label: "Sponsor", blurb: "Power the week." },
];

export function PlugInForm() {
  const [path, setPath] = React.useState<Path>("speak");
  const { setColor } = useBoltColor();

  function choose(p: Path) {
    setPath(p);
    // The bolt only tints for the speaker circuit picker; reset it otherwise.
    if (p !== "speak") setColor(DEFAULT_CIRCUIT_COLOR);
  }

  const active = PATHS.find((p) => p.key === path);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div
          role="tablist"
          aria-label="How do you want to plug in?"
          className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-1"
        >
          {PATHS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={path === p.key}
              onClick={() => choose(p.key)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                path === p.key
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {active && (
          <p className="mt-2 text-sm text-muted-foreground">{active.blurb}</p>
        )}
      </div>

      {path === "speak" && <SpeakerForm />}
      {path === "volunteer" && <VolunteerForm />}
      {path === "sponsor" && <SponsorForm />}
    </div>
  );
}
