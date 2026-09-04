import { TRACK_NAMES } from "@/lib/tracks";
import { cn } from "@/lib/utils";

// Opacity *and* size, which the TPR cards' version doesn't need.
//
// There the ramp is one magenta at five alphas on black, and the dim end
// reads as dim because the ground behind it is the darkest thing on the card.
// Inverted onto white the same five alphas collapse: 30% magenta on white is
// a pale pink that sits about as far from the page as 100% magenta does, so
// the ramp came out as five pips of roughly equal weight strung on a rule — a
// slider, not a charge. Growing the pip along with the alpha is what survives
// the ground change, because size doesn't depend on contrast.
//
// Asserted against TRACK_NAMES so it can't drift out of step with the
// circuits it stands for.
// `magenta-ink`, not `magenta`, and this is the one place on a light ground
// where a decorative accent takes the text colour rather than the house one.
//
// The rule in globals.css is about legibility: #ff32a0 is 3.38:1 on white, so
// anything small enough to count as normal text uses #c7277d instead. Nothing
// forces that on a row of dots. What does force it is where this sits — the
// ramp rides the "Featured" eyebrow, so its brightest pip lands on the same
// baseline as an 11px label in the ink, a few characters apart. Two pinks a
// shade apart at that distance read as a mistake rather than as a system.
// The bolt, the button and the headline's accent word are all far enough from
// any ink to keep the house colour.
const CHARGE = [
  "h-1 w-1 text-magenta-ink/35",
  "h-1.5 w-1.5 text-magenta-ink/50",
  "h-2 w-2 text-magenta-ink/68",
  "h-2.5 w-2.5 text-magenta-ink/84",
  "h-3 w-3 text-magenta-ink",
] satisfies { length: (typeof TRACK_NAMES)["length"] } & string[];

/**
 * The five circuits as a bus, running dim to full charge.
 *
 * room-flow.tsx draws these pips free-standing; the TPR social cards add the
 * rail they land on, because there the connecting is the point. Here it rides
 * the "Featured" eyebrow, which is the one line in the bill that had nothing
 * to say — a mono label in the corner of a list. Paired with the ramp it
 * stops being a label and starts being the header of the thing below it, and
 * the charge arriving at full on the right points into the list.
 *
 * No caption of its own. The eyebrow beside it is the caption, and the label
 * a screen reader needs is on the element.
 */
export function CircuitBus({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Five circuits, one current"
      className={cn("relative flex items-center justify-between", className)}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0.5 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(to_right,rgba(199,39,125,0.16),rgba(199,39,125,0.95))]"
      />
      {TRACK_NAMES.map((name, i) => (
        <span
          key={name}
          className={cn(
            "relative shrink-0 rounded-full bg-current shadow-[0_0_8px_currentColor]",
            CHARGE[i],
          )}
        />
      ))}
    </span>
  );
}
