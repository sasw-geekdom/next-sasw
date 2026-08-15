import type { ToolMarkName } from "@/lib/tool-marks";

// ── The flow ────────────────────────────────────────────────────────────────
//
// The hero as a node graph, which is the category's own visual grammar. Runway
// names it outright — "custom node-based workflows that chain together multiple
// models, modalities and intermediary steps" — and ElevenLabs calls the same
// shape a "creative pipeline". Anyone who has opened Runway Flows, ComfyUI or a
// Figma prototype canvas reads it without a caption.
//
// ── Three tiers ────────────────────────────────────────────────────────────
//
//   1. Four small inputs across the top — text, image, video, audio. Bare
//      words, no card and no "models" suffix: they are the kinds of thing you
//      bring, and the models are what they land on.
//   2. The two that lead. Text goes to Claude Code; image, video and audio all
//      go to Seedance 2.5, which is a fact rather than a composition —
//      ByteDance describe 2.5 as taking text, image, video or audio. Claude
//      Code then hands across to Seedance, which is the afternoon in one wire:
//      the thing you write with feeding the thing you shoot with.
//   3. The rest of the catalogue, in a four-column grid sitting directly under
//      the four inputs. The columns are the modalities — nothing labels them,
//      because they line up with the words already at the top of their own
//      column. That alignment is doing the work a header would.
//
// The grid is deliberately unwired. In a real canvas not everything is
// connected, and four more curves down each lane would bury the five that
// carry the idea.
//
// There is no output node. Showing one would put a single finished artefact at
// the end of a diagram whose whole point is the breadth at the front.
//
// There is no output node. Showing one would put a single finished artefact at
// the end of a diagram whose whole point is the breadth at the front. It also
// leaves public/the-model/key-art-loop.mp4 and key-art-poster.jpg unused —
// they are the video the previous build ended on, kept in case it returns.
//
// Positions are percentages of the canvas, hand-placed. Anchors are not: they
// are measured off the rendered cards, because a card is as wide as its text.

export type Side = "top" | "right" | "bottom" | "left";

export interface FlowNode {
  id: string;
  /** Box position, percent of the canvas from its left and top edges. */
  x: number;
  y: number;
  /** The card's content. */
  t: string;
  /**
   * How loudly it renders.
   *
   *   `modality`  — an input at the top. Glyph and label, no card.
   *   `spotlight` — one of the two models the afternoon leads with.
   *   `sea`       — the rest of the catalogue, quiet.
   */
  variant: "modality" | "spotlight" | "sea";
  /** A modality glyph, for the inputs. */
  glyph?: "text" | "image" | "film" | "audio";
  icon?: ToolMarkName;
  /**
   * Which step of the walk lights this node. The pointer crosses the inputs,
   * drops to the spotlights, then to the field.
   */
  step: 0 | 1 | 2;
  outSide?: Side;
  inSide?: Side;
  anchor?: "left" | "center";
}

export const FLOW_NODES: readonly FlowNode[] = [
  // ── 1. What you bring ────────────────────────────────────────────────────
  { id: "text", x: 12, y: 2, t: "text", variant: "modality", glyph: "text", step: 0, anchor: "center", outSide: "bottom" },
  { id: "image", x: 37, y: 2, t: "image", variant: "modality", glyph: "image", step: 0, anchor: "center", outSide: "bottom" },
  { id: "video", x: 62, y: 2, t: "video", variant: "modality", glyph: "film", step: 0, anchor: "center", outSide: "bottom" },
  { id: "audio", x: 87, y: 2, t: "audio", variant: "modality", glyph: "audio", step: 0, anchor: "center", outSide: "bottom" },

  // ── 2. The two that lead ─────────────────────────────────────────────────
  { id: "claude-code", x: 24, y: 31, t: "claude-code", variant: "spotlight", icon: "claudecode", step: 1, anchor: "center" },
  { id: "seedance", x: 68, y: 31, t: "seedance-2.5", variant: "spotlight", icon: "bytedance", step: 1, anchor: "center" },

  // ── 3. The rest, one column per modality, aligned under its input ────────
  { id: "codex", x: 12, y: 60, t: "codex", variant: "sea", icon: "codex", step: 2, anchor: "center" },
  { id: "flux", x: 37, y: 60, t: "flux-2-pro", variant: "sea", icon: "flux", step: 2, anchor: "center" },
  { id: "veo", x: 62, y: 60, t: "veo-3.1", variant: "sea", icon: "gemini", step: 2, anchor: "center" },
  { id: "fish", x: 87, y: 60, t: "s2.1-pro", variant: "sea", icon: "fishaudio", step: 2, anchor: "center" },

  { id: "grok", x: 12, y: 78, t: "grok-4.6", variant: "sea", icon: "grok", step: 2, anchor: "center" },
  { id: "gptimage", x: 37, y: 78, t: "gpt-image-2", variant: "sea", icon: "openai", step: 2, anchor: "center" },
  { id: "kling", x: 62, y: 78, t: "kling-v3.0", variant: "sea", icon: "kling", step: 2, anchor: "center" },
  { id: "groktts", x: 87, y: 78, t: "grok-tts", variant: "sea", icon: "grok", step: 2, anchor: "center" },
];

/**
 * The five that carry the idea, and no more.
 *
 * Text to Claude Code; image, video and audio to Seedance; then Claude Code
 * across to Seedance. That last one is the point of the whole picture — the
 * tool the developers in the room live in handing off to the one the video
 * people live in, which is the event's claim drawn as a single wire.
 */
export const FLOW_EDGES: readonly [string, string][] = [
  ["text", "claude-code"],
  ["image", "seedance"],
  ["video", "seedance"],
  ["audio", "seedance"],
  ["claude-code", "seedance"],
];

/** Which side each wire leaves and lands on. */
export const FLOW_EDGE_SIDES: Record<string, { from: Side; to: Side }> = {
  "text-claude-code": { from: "bottom", to: "top" },
  "image-seedance": { from: "bottom", to: "left" },
  "video-seedance": { from: "bottom", to: "top" },
  "audio-seedance": { from: "bottom", to: "right" },
  // Across, not down: a horizontal wire is what makes this read as a handoff
  // between peers rather than as another input falling in from above.
  "claude-code-seedance": { from: "right", to: "left" },
};

/** Radius of a port ring, in the edge layer's own units. */
export const FLOW_PORT_R = 1.05;

/**
 * Port and edge colour, keyed by the input the wire carries.
 *
 * Taken from Runway's own Workflows canvas, which colours every port by type
 * and tints each connector to match its source. It is the cheapest legibility
 * win in the diagram: you can tell what kind of thing is moving without reading
 * a label.
 *
 * The artwork's own hues rather than Runway's, and no green — that belongs to
 * Access Granted on this site, and a wire this prominent in the wrong colour
 * would read as the wrong activation. See lib/the-model.ts.
 */
export const FLOW_WIRE = {
  text: "#C0B4FC",
  image: "#00B4FC",
  video: "#4848FC",
  audio: "#FC3030",
  // The handoff carries text, so it keeps text's colour across the gap.
  "claude-code": "#C0B4FC",
} as const;

/**
 * The path the pointer walks, in canvas percent.
 *
 * Across the four inputs, down to Claude Code, across the handoff to Seedance,
 * then into the grid — hand-placed rather than derived from the edges, because
 * the pointer is one continuous gesture and the edges are five separate curves.
 */
export const FLOW_PATH: readonly { x: number; y: number }[] = [
  { x: 8, y: 8 },
  { x: 89, y: 8 },
  { x: 24, y: 36 },
  { x: 68, y: 36 },
  { x: 50, y: 70 },
];
