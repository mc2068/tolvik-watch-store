// The Hero Timepiece's Pose: how the watch is held at one moment of the acts.
// It is a pure function of each act's progress and the Stage's shape, so
// scrolling back up plays every act in reverse, and the frame loop has only
// to apply what it is given. The Shopper's drag is not part of it: the frame
// loop adds that on top.

import { Euler, Quaternion } from "three";

import {
  clamp01,
  slowToRest,
  swell,
  through,
} from "@/components/three/easing";
import {
  EXPLODED_VIEW_CLOSES,
  partOffsets,
  partSeparation,
} from "@/components/three/exploded-view";
import {
  CAMERA_DISTANCE,
  distanceToFit,
  LENS,
} from "@/components/three/framing";
import { type Part, PARTS } from "@/components/three/hero-model";
import type { Act } from "@/lib/act-progress";

export type Pose = {
  /**
   * Which way the watch faces: the turn from how the model is built, dial to
   * the Shopper and twelve up, as a quaternion's x, y, z and w.
   */
  facing: readonly [number, number, number, number];
  /**
   * Where the watch stands: how far from its resting place, in model units,
   * to the Shopper's right, upwards and towards the Shopper.
   */
  place: readonly [number, number, number];
  /** How much of the studio's light reaches the watch: 0 dark, 1 full. */
  light: number;
  /** How far the studio has turned about the upright axis, in radians. */
  studioTurn: number;
  /** Where the Exploded View has each part. */
  parts: Record<Part, PartPose>;
};

export type PartPose = {
  /**
   * How far the part is from its place along the watch's axis, in model
   * units, positive towards the Shopper's side of the dial.
   */
  offset: number;
  /** How far it has left its place: 0 at rest, 1 fully apart. */
  separation: number;
};

// How the finished watch rests once it has arrived: a little short of square
// on, so the case shows its side, and tipped up slightly to the eye.
const REST = { yaw: -0.38, pitch: 0.1 } as const;
const RESTING = new Quaternion().setFromEuler(
  new Euler(REST.pitch, REST.yaw, 0),
);

// How the turn act leaves it: in profile, the crown towards the Shopper,
// just short of side on so the dial still catches the light.
const PROFILE = { yaw: -1.36, pitch: 0.06 } as const;
const IN_PROFILE = new Quaternion().setFromEuler(
  new Euler(PROFILE.pitch, PROFILE.yaw, 0),
);
// The studio is lit for a watch that faces the Shopper, and a watch in
// profile would show its side to the dark. So the studio turns with it, by
// this much about the upright axis, until one of its tall strips stands
// where the side of the case and the crown reflect it.
const PROFILE_STUDIO_TURN = 1.5;

// How it lies for the Exploded View: on its back, dial up, so its axis
// stands upright on the Stage and the parts lift one above another. It is
// tipped towards the Shopper, who looks down onto each part, and turned on
// its axis to bring the crown round to the front.
const LYING_TIP = 0.42;
const LYING_TURN = -0.6;
const LYING = new Quaternion().setFromEuler(
  new Euler(LYING_TIP - Math.PI / 2, 0, LYING_TURN),
);
// Lying down, the watch also steps back and aside. The open layout, with the
// parts' names to its right, is this big in model units, far more than the
// watch, and must be seen whole on any Stage; the watch's axis stands left
// of its middle, to leave the names their room.
const OPEN_WATCH = { width: 4.3, height: 5.3 } as const;
const LYING_PLACE = { x: -0.6, y: -0.1 } as const;

// The arrival act: the watch comes out of the dark. This is where it opens,
// as a turn and a tilt away from rest and a distance behind it. By the act's
// end all three have run out and the light is full.
const OPENING = { light: 0.22, yaw: -0.45, pitch: -0.3, depth: 1.6 } as const;

function arrival(progress: number) {
  const t = clamp01(progress);
  const towardsRest = (opening: number) => opening - opening * slowToRest(t);

  return {
    light: OPENING.light + (1 - OPENING.light) * swell(t),
    yaw: towardsRest(OPENING.yaw),
    pitch: towardsRest(OPENING.pitch),
    depth: towardsRest(OPENING.depth),
  };
}

// The turn act: the watch turns from facing the Shopper to its profile, so
// the case, the crown and the bracelet are seen from the side. This is the
// stretch of the act over which it turns. It holds its profile for the rest,
// so the side is seen at rest before the Exploded View begins.
const TURNS = [0.05, 0.8] as const;

/** How far the watch has turned: 0 as it arrived, 1 in profile. */
function turn(progress: number) {
  return swell(through(TURNS, progress));
}

// The Exploded View act: the watch lies down, lifts apart, closes and rises
// again. This is its score, as stretches of its progress. The moves follow
// one another and never overlap: the watch is lying still while it is apart.
// Between coming apart and closing, every part is out and named, and nothing
// moves. When it closes is set beside the layout, where Home can read it
// without loading any 3D code.
const LAYS_DOWN = [0.02, 0.24] as const;
const COMES_APART = [0.24, 0.5] as const;
const RISES = [0.82, 0.98] as const;

function explodedView(progress: number) {
  return {
    /** How far the watch has lain down, dial up: 0 as the turn left it. */
    laid: swell(through(LAYS_DOWN, progress)),
    /** How far the layout has opened: the progress `partOffsets` takes. */
    apart:
      through(COMES_APART, progress) - through(EXPLODED_VIEW_CLOSES, progress),
    /** How far the closed watch has risen back to face the Shopper. */
    risen: swell(through(RISES, progress)),
  };
}

/**
 * The acts as the arrival act leaves them: the watch at rest, facing the
 * Shopper and fully lit. A page with no acts holds the watch here.
 */
export const ARRIVED: Record<Act, number> = {
  arrival: 1,
  turn: 0,
  "exploded-view": 0,
};

// Kept between calls, so that working out a Pose makes nothing but the Pose.
const tilt = new Euler();
const held = new Quaternion();

/**
 * The Pose of a watch this far along each act, on a Stage of the given
 * aspect (width over height). It is defined for any three values, not only
 * those scroll can produce, and a small change in any of them is a small
 * change in the Pose.
 */
export function poseAt(progress: Record<Act, number>, aspect: number): Pose {
  const arrived = arrival(progress.arrival);
  const turned = turn(progress.turn);
  const { laid, apart, risen } = explodedView(progress["exploded-view"]);

  // A slerp is the shortest turn from one way of holding the watch to
  // another. The acts chain three: round to the profile, down onto its
  // back, and up again to rest.
  tilt.set(REST.pitch + arrived.pitch, REST.yaw + arrived.yaw, 0);
  held
    .setFromEuler(tilt)
    .slerp(IN_PROFILE, turned)
    .slerp(LYING, laid)
    .slerp(RESTING, risen);

  // How much of the way the watch is to where it lies, there and back.
  const lying = laid * (1 - risen);
  const lyingDepth = distanceToFit(OPEN_WATCH, LENS, aspect) - CAMERA_DISTANCE;

  const offsets = partOffsets(apart);
  const separation = partSeparation(apart);
  const parts = {} as Record<Part, PartPose>;
  for (const part of PARTS) {
    parts[part] = { offset: offsets[part], separation: separation[part] };
  }

  return {
    facing: [held.x, held.y, held.z, held.w],
    place: [
      LYING_PLACE.x * lying,
      LYING_PLACE.y * lying,
      -arrived.depth - lyingDepth * lying,
    ],
    light: arrived.light,
    studioTurn: PROFILE_STUDIO_TURN * turned * (1 - laid),
    parts,
  };
}
