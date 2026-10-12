// The Exploded View: the Hero Timepiece lies down, lifts apart into its seven
// parts along its own axis, and closes and rises again. Like the arrival, it
// is made of pure functions of progress, so scrolling back up plays it in
// reverse.

import { clamp01, swell, through } from "@/components/three/easing";
import { type Part, PARTS } from "@/components/three/hero-model";

// How far each part travels along the watch's axis, in model units, where
// the case is 2 across. The case holds its place: what sits in front of it
// lifts towards the crystal, what sits behind it drops towards the bracelet.
const FULL_OFFSET: Record<Part, number> = {
  crystal: 1.3,
  hands: 0.95,
  dial: 0.65,
  "dial-base": 0.38,
  case: 0,
  "crown-and-pushers": -0.4,
  bracelet: -0.75,
};

const REACH = Math.max(...PARTS.map((part) => Math.abs(FULL_OFFSET[part])));

// The parts do not leave together. The further a part has to go, the sooner
// it sets off, so the watch opens from the outside in: the crystal lifts
// first and the case, which goes nowhere, is the last to be named. This is
// the share of the way that the last part waits before its turn.
const STAGGER = 0.5;

/**
 * How far each part has left its place, from 0 at rest to 1 fully apart,
 * for a watch that is `progress` of the way to its full layout.
 */
export function partSeparation(progress: number): Record<Part, number> {
  const t = clamp01(progress);
  const separation = {} as Record<Part, number>;

  for (const part of PARTS) {
    const wait = STAGGER * (1 - Math.abs(FULL_OFFSET[part]) / REACH);
    separation[part] = swell(clamp01((t - wait) / (1 - STAGGER)));
  }
  return separation;
}

/**
 * The Exploded View's layout: each part's offset along the watch's axis, in
 * model units, positive towards the Shopper's side of the dial. At 0 every
 * part is at rest; at 1 every part is at its full offset.
 */
export function partOffsets(progress: number): Record<Part, number> {
  const separation = partSeparation(progress);
  const offsets = {} as Record<Part, number>;

  for (const part of PARTS) {
    offsets[part] = FULL_OFFSET[part] * separation[part];
  }
  return offsets;
}

export type ExplodedViewPose = {
  /** How far the watch has lain down, dial up: 0 as the turn left it, 1 flat. */
  laid: number;
  /** How far the layout has opened: the progress `partOffsets` takes. */
  apart: number;
  /** How far the closed watch has risen back to face the Shopper. */
  risen: number;
};

// The act's score, as stretches of its progress. The moves follow one
// another and never overlap: the watch is lying still while it is apart.
const LAYS_DOWN = [0.02, 0.24] as const;
const COMES_APART = [0.24, 0.5] as const;
// Between the two, every part is out and named, and nothing moves.
const CLOSES = [0.64, 0.82] as const;
const RISES = [0.82, 0.98] as const;

export function explodedViewPose(progress: number): ExplodedViewPose {
  return {
    laid: swell(through(LAYS_DOWN, progress)),
    apart: through(COMES_APART, progress) - through(CLOSES, progress),
    risen: swell(through(RISES, progress)),
  };
}
