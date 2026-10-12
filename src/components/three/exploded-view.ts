// The Exploded View's layout: where the Hero Timepiece's seven parts go as
// it lifts apart along its own axis. It is made of pure functions of
// progress, so scrolling back up closes the watch the way it opened. How the
// watch lies down for it, and when, is part of its Pose, in `pose.ts`.

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
    separation[part] = swell(through([wait, wait + 1 - STAGGER], t));
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

// The stretch of the Exploded View act over which the open watch closes
// again. The rest of the act's score is with the Pose; this one is here
// because Home reads it, to have the act's statement gone by then, and Home
// must not load the 3D maths the Pose is worked out with.
export const EXPLODED_VIEW_CLOSES = [0.64, 0.82] as const;
