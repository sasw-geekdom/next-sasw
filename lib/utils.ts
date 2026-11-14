import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, told about the type scale in globals.css.
 *
 * Out of the box it doesn't know `text-title`, `text-caption` and the rest are
 * font sizes, so it files them as text colours — and then "resolves" a
 * conflict that isn't one: `text-title text-magenta` came out as plain
 * `text-magenta`, the size silently dropped. That lost two of the sponsor
 * report PDF's headline figures their size. Registering the scale makes them
 * merge as sizes: they replace each other, and leave colours alone.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["title", "subtitle", "heading", "subheading", "section", "body", "caption"],
    },
  },
});

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
