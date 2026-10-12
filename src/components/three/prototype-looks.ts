// PROTOTYPE, throwaway: the three looks of the Exploded View being compared.
// See src/lib/prototype-variant.ts. Plain numbers only, so Home can read the
// looks without loading any 3D code.

import type { Part } from "@/components/three/hero-model";
import type { Variant } from "@/lib/prototype-variant";

export type Look = {
  /** How the watch is held while it is open: pitch, yaw, roll in radians. */
  lying: readonly [number, number, number];
  /** Whether the studio keeps the turn it made for the profile. */
  keepsStudioTurn: boolean;
  /** The size of the open layout with its names, in model units. */
  layout: { width: number; height: number };
  /** Where the watch's axis stands, from the middle of the Stage. */
  place: { x: number; y: number };
  /** How far each part travels along the watch's axis. */
  travel: Record<Part, number>;
  /**
   * Where each part's name stands from the part, across and up the screen in
   * model units, or null when the names are not set on the watch at all.
   */
  names: Record<Part, readonly [number, number]> | null;
  /** How far a part steps aside when the index calls it out. */
  callOut: number;
};

const STACK_TRAVEL: Record<Part, number> = {
  crystal: 1.3,
  hands: 0.95,
  dial: 0.65,
  "dial-base": 0.38,
  case: 0,
  "crown-and-pushers": -0.4,
  bracelet: -0.75,
};

const beside = [1.4, 0] as const;

export const LOOKS: Record<Variant, Look> = {
  // A: as built in ticket 7. The watch on its back, the parts one above
  // another, the names in a column to their right.
  A: {
    lying: [0.42 - Math.PI / 2, 0, -0.6],
    keepsStudioTurn: false,
    layout: { width: 4.3, height: 5.3 },
    place: { x: -0.6, y: -0.1 },
    travel: STACK_TRAVEL,
    names: {
      crystal: beside,
      hands: beside,
      dial: beside,
      "dial-base": beside,
      case: beside,
      "crown-and-pushers": beside,
      bracelet: beside,
    },
    callOut: 0,
  },

  // B: the watch never lies down. It stays in profile and is drawn out
  // sideways into an even row, crystal on the left and bracelet on the
  // right, with the names by turns above and below it.
  B: {
    lying: [0.14, -1.2, 0],
    keepsStudioTurn: true,
    layout: { width: 6.6, height: 5 },
    place: { x: 0.25, y: 0 },
    travel: {
      crystal: 2,
      hands: 1.5,
      dial: 1,
      "dial-base": 0.5,
      case: 0,
      "crown-and-pushers": -0.6,
      bracelet: -1.2,
    },
    names: {
      crystal: [0, -1.25],
      hands: [0, 1.25],
      dial: [0, -1.25],
      "dial-base": [0, 1.25],
      case: [0, -1.55],
      "crown-and-pushers": [0, 1.25],
      bracelet: [0, -1.8],
    },
    callOut: 0,
  },

  // C: the upright stack again, larger and in the middle, with no names on
  // it. The names are an index in the act's copy, and as the Shopper scrolls
  // each part in turn steps out of the stack while its name lights up.
  C: {
    lying: [0.42 - Math.PI / 2, 0, -0.6],
    keepsStudioTurn: false,
    layout: { width: 3.6, height: 5.3 },
    place: { x: -0.2, y: -0.1 },
    travel: STACK_TRAVEL,
    names: null,
    callOut: 0.55,
  },
};
