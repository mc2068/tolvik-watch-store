import { type RefObject, useEffect, useRef } from "react";
import { invalidate } from "@react-three/fiber";
import {
  Box3,
  type Camera,
  type Mesh,
  type Object3D,
  Quaternion,
  Vector3,
} from "three";

import { clamp01, swell, through } from "@/components/three/easing";
import { partOffsets, partSeparation } from "@/components/three/exploded-view";
import { type Part, PARTS } from "@/components/three/hero-model";
import { LOOKS } from "@/components/three/prototype-looks";
import { partLabels } from "@/lib/part-labels";
import { prototypeVariant } from "@/lib/prototype-variant";

// PROTOTYPE (variant C): the stretch of the act over which the index calls
// the parts out, one after another.
const CALLED_OUT = [0.38, 0.66] as const;
// How far either side of its own turn a part is still stepping out or back,
// in turns.
const CALL_OUT_SPREAD = 0.75;

// A part is named over the last stretch of its way out, once it is clear of
// its neighbours: names that came up any sooner would lie on one another.
const NAMED = [0.7, 1] as const;

const point = new Vector3();
const aside = new Vector3();
const held = new Quaternion();

type Layer = {
  part: Object3D;
  /** The middle of the part's depth along the axis, at rest. */
  depth: number;
};

/** Finds the seven parts under `watch` and measures where each sits. */
function findLayers(watch: Object3D): Record<Part, Layer> {
  const layers = {} as Record<Part, Layer>;
  const box = new Box3();

  for (const name of PARTS) {
    const part = watch.getObjectByName(name);
    if (!part) throw new Error(`The Hero Timepiece has no part named ${name}`);
    box.makeEmpty();
    part.traverse((child) => {
      const { geometry } = child as Mesh;
      if (!geometry) return;
      geometry.computeBoundingBox();
      box.union(geometry.boundingBox!);
    });
    layers[name] = { part, depth: (box.min.z + box.max.z) / 2 };
  }
  return layers;
}

/**
 * Opens the Hero Timepiece into its Exploded View. It returns the function
 * the frame loop calls, once the watch has been posed for the frame, with
 * how far apart the layout is: it moves each part along the watch's axis and
 * tells Home where on the screen each part's name belongs.
 *
 * PROTOTYPE: the travel, the names' places and the call-out come from the
 * look of the variant in effect, and `progress` is the act's own progress.
 */
export function useExplodedView(
  watch: RefObject<Object3D | null>,
): (
  apart: number,
  camera: Camera,
  canvas: HTMLCanvasElement,
  progress: number,
) => void {
  const layers = useRef<Record<Part, Layer>>(null);
  const lastApart = useRef(0);

  useEffect(() => () => partLabels.clear(), []);
  // Draw a frame when the variant is switched.
  useEffect(() => prototypeVariant.onChange(() => invalidate()), []);

  return (apart, camera, canvas, progress) => {
    if (!watch.current) return;

    // A closed watch that was closed on the last frame too has nothing to
    // move. The names are still placed once, out of sight, to tell Home the
    // scene is here.
    if (apart === 0 && lastApart.current === 0 && partLabels.get()) {
      prototypeVariant.setFocus(-1);
      return;
    }
    lastApart.current = apart;

    layers.current ??= findLayers(watch.current);
    const { current: found } = layers;
    const look = LOOKS[prototypeVariant.get()];

    // Which way is the Shopper's right, as the parts see it.
    watch.current.updateWorldMatrix(true, true);
    found.case.part.parent!.getWorldQuaternion(held).invert();
    aside.set(1, 0, 0).applyQuaternion(held);

    // Each part has its turn at a whole number and a half of `turn`.
    const turn =
      -CALL_OUT_SPREAD +
      through(CALLED_OUT, progress) * (PARTS.length + 2 * CALL_OUT_SPREAD);
    const calling = look.callOut > 0 && turn >= 0 && turn < PARTS.length;
    const focus = calling ? Math.floor(turn) : -1;

    const offsets = partOffsets(apart, look.travel);
    PARTS.forEach((name, index) => {
      const out =
        look.callOut *
        apart *
        swell(clamp01(1 - Math.abs(turn - (index + 0.5)) / CALL_OUT_SPREAD));
      found[name].part.position
        .set(0, 0, offsets[name])
        .addScaledVector(aside, out);
    });
    prototypeVariant.setFocus(focus);

    const separation = partSeparation(apart, look.travel);
    watch.current.updateWorldMatrix(true, true);
    camera.updateMatrixWorld();
    const stage = canvas.getBoundingClientRect();
    partLabels.place((name, label) => {
      const { part, depth } = found[name];
      const [across, up] = look.names?.[name] ?? [0, 0];
      part.localToWorld(point.set(0, 0, depth));
      // The camera looks straight down the scene's Z axis, so the scene's X
      // and Y are the Stage's.
      point.x += across;
      point.y += up;
      point.project(camera);
      label.x = stage.left + ((point.x + 1) / 2) * stage.width;
      label.y = stage.top + ((1 - point.y) / 2) * stage.height;
      label.shown = look.names ? through(NAMED, separation[name]) : 0;
    });
  };
}
