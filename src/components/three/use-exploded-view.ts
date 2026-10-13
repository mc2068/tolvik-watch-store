import { type RefObject, useEffect, useRef } from "react";
import { Box3, type Camera, type Mesh, type Object3D, Vector3 } from "three";

import { through } from "@/components/three/easing";
import { type Part, PARTS } from "@/components/three/hero-model";
import type { PartPose } from "@/components/three/pose";
import { partLabels } from "@/lib/part-labels";

// How far to the Shopper's right of the watch's axis each part's name is
// set, in model units: clear of the widest part, so the names form a column
// beside the watch.
const LABEL_REACH = 1.4;

// A part is named over the last stretch of its way out, once it is clear of
// its neighbours: names that came up any sooner would lie on one another.
const NAMED = [0.7, 1] as const;

const point = new Vector3();

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
 * where the Pose has each part: it moves each part along the watch's axis
 * and tells Home where on the screen each part's name belongs.
 */
export function useExplodedView(
  watch: RefObject<Object3D | null>,
): (
  parts: Record<Part, PartPose>,
  camera: Camera,
  canvas: HTMLCanvasElement,
) => void {
  const layers = useRef<Record<Part, Layer>>(null);
  const wasClosed = useRef(true);

  useEffect(() => () => partLabels.clear(), []);

  return (parts, camera, canvas) => {
    if (!watch.current) return;

    // A closed watch that was closed on the last frame too has nothing to
    // move. The names are still placed once, out of sight, to tell Home the
    // scene is here.
    const closed = PARTS.every((name) => parts[name].separation === 0);
    if (closed && wasClosed.current && partLabels.get()) return;
    wasClosed.current = closed;

    layers.current ??= findLayers(watch.current);
    const { current: found } = layers;

    for (const name of PARTS) found[name].part.position.z = parts[name].offset;

    watch.current.updateWorldMatrix(true, true);
    camera.updateMatrixWorld();
    const stage = canvas.getBoundingClientRect();
    partLabels.place((name, label) => {
      const { part, depth } = found[name];
      part.localToWorld(point.set(0, 0, depth));
      // The camera looks straight down the scene's Z axis, so the scene's X
      // is the Stage's.
      point.x += LABEL_REACH;
      point.project(camera);
      label.x = stage.left + ((point.x + 1) / 2) * stage.width;
      label.y = stage.top + ((1 - point.y) / 2) * stage.height;
      label.shown = through(NAMED, parts[name].separation);
    });
  };
}
