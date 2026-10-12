// The arrival act: the Hero Timepiece comes out of the dark. It is a pure
// function of the act's progress, so scrolling back up plays it in reverse.

import { clamp01, slowToRest, swell } from "@/components/three/easing";

export type ArrivalPose = {
  /** How much of the studio's light reaches the watch: 0 dark, 1 full. */
  light: number;
  /** Turn away from the Shopper about the upright axis, in radians. */
  yaw: number;
  /** Tilt back from the Shopper, in radians. */
  pitch: number;
  /** How far behind its resting place the watch sits, in model units. */
  depth: number;
};

// Where the act opens. At its end all four have run out: light 1, the rest 0.
const OPENING: ArrivalPose = {
  light: 0.22,
  yaw: -0.45,
  pitch: -0.3,
  depth: 1.6,
};

export function arrivalPose(progress: number): ArrivalPose {
  const t = clamp01(progress);
  const towardsRest = (opening: number) => opening - opening * slowToRest(t);

  return {
    light: OPENING.light + (1 - OPENING.light) * swell(t),
    yaw: towardsRest(OPENING.yaw),
    pitch: towardsRest(OPENING.pitch),
    depth: towardsRest(OPENING.depth),
  };
}
