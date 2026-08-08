"use client";

import { ProbeChip, useProbeChip } from "@/components/site/probe-chip";
import { cn } from "@/lib/utils";

/**
 * One org's mark in a "powered by" wall, linked to whoever runs it.
 *
 * Lifted out of PysaBand so both banded activations hover the same way rather
 * than each inventing one — the probe chip naming the org, the lift from 85%
 * to full opacity, the offset focus ring. A mark with no home page renders
 * unlinked rather than as a dead anchor.
 *
 * Plain `img`: several small marks on one row, some of them SVG, and routing
 * each through next/image costs more than it saves.
 */
export function OrganizerLogo({
  org,
}: {
  org: {
    name: string;
    logo: string;
    heightClass: string;
    href?: string;
  };
}) {
  const { chipRef, probeProps } = useProbeChip();

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={org.logo}
      alt={org.name}
      className={cn("w-auto object-contain", org.heightClass)}
    />
  );

  if (!org.href) return <span className="block opacity-85">{img}</span>;

  return (
    <a
      href={org.href}
      target="_blank"
      rel="noreferrer"
      {...probeProps}
      className="group relative block opacity-85 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
    >
      {img}
      <ProbeChip chipRef={chipRef}>{org.name}</ProbeChip>
    </a>
  );
}
