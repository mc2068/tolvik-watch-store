// How the camera frames the Hero Timepiece. The scene is composed inside a
// square: whatever the shape of the stage, that square is fitted into it
// whole, the way `object-fit: contain` fits an image. A still rendered square
// with the same lens therefore lines up with the live canvas at any size.

// The camera: a long lens set well back, as a product photographer would
// use, so the watch is not distorted. The lens angle is in degrees and the
// distance in model units, where the case is 2 units across.
export const LENS = 30;
export const CAMERA_DISTANCE = 7.4;

/**
 * The upright field of view, in degrees, that fits the square a `reference`
 * lens sees into a stage of the given aspect (width over height).
 */
export function containFov(reference: number, aspect: number): number {
  if (aspect >= 1) return reference;

  const halfAngle = Math.atan(Math.tan((reference * Math.PI) / 360) / aspect);
  return (halfAngle * 360) / Math.PI;
}

/**
 * How far from the camera something `width` by `height`, in model units,
 * must stand to be seen whole on a stage of the given aspect. The camera
 * keeps the square of its `reference` lens in view, so a wide stage sees
 * further to the sides and a tall one further up and down.
 */
export function distanceToFit(
  { width, height }: { width: number; height: number },
  reference: number,
  aspect: number,
): number {
  const square = Math.max(
    width / Math.max(1, aspect),
    height * Math.min(1, aspect),
  );
  return square / (2 * Math.tan((reference * Math.PI) / 360));
}
