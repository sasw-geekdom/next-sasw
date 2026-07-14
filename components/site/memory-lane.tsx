"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import type { GalleryImage } from "@/lib/gallery";

// Deterministic per-photo values (stable across SSR/client — no hydration drift).
function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h;
}
const tiltOf = (name: string) => (hash(name) % 500) / 100 - 2.5; // -2.5..2.5deg
const depthOf = (name: string) => 24 + (hash(name) % 44); // 24..68px parallax

function Photo({ img }: { img: GalleryImage }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const depth = depthOf(img.name);
  const y = useTransform(scrollYProgress, [0, 1], [depth, -depth]);
  const rot = tiltOf(img.name);

  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { y }}
      className="mb-4 break-inside-avoid sm:mb-5"
    >
      <motion.figure
        initial={{ opacity: 0, y: 34, scale: 0.96, rotate: rot * 1.7 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotate: rot }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg shadow-black/20"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt=""
          loading="lazy"
          className="w-full"
        />
      </motion.figure>
    </motion.div>
  );
}

/** Scroll-driven "down memory lane" gallery — parallax + reveal per photo. */
export function MemoryLane({ images }: { images: GalleryImage[] }) {
  return (
    <section className="bg-black pb-28 pt-4 text-white">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            Down memory lane
          </p>
          <p className="mt-2 font-display text-2xl font-bold uppercase sm:text-3xl">
            {images.length} moments, 15 years
          </p>
        </div>

        <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4">
          {images.map((img) => (
            <Photo key={img.name} img={img} />
          ))}
        </div>
      </div>
    </section>
  );
}
