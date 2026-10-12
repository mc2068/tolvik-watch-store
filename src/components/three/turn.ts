// The turn act: the Hero Timepiece turns from facing the Shopper to its
// profile, so the case, the crown and the bracelet are seen from the side.
// A pure function of the act's progress, like the arrival.

import { swell, through } from "@/components/three/easing";

export type TurnPose = {
  /** How far the watch has turned: 0 as it arrived, 1 in profile. */
  turned: number;
};

// The stretch of the act over which the watch turns. It holds its profile
// for the rest, so the side is seen at rest before the Exploded View begins.
const TURNS = [0.05, 0.8] as const;

export function turnPose(progress: number): TurnPose {
  return { turned: swell(through(TURNS, progress)) };
}
