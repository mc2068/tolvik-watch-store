// How the camera frames the Hero Timepiece. The scene is composed inside a
// square: whatever the shape of the stage, that square is fitted into it
// whole, the way `object-fit: contain` fits an image. A still rendered square
// with the same lens therefore lines up with the live canvas at any size.

/**
 * The upright field of view, in degrees, that fits the square a `reference`
 * lens sees into a stage of the given aspect (width over height).
 */
export function containFov(reference: number, aspect: number): number {
  if (aspect >= 1) return reference;

  const halfAngle = Math.atan(Math.tan((reference * Math.PI) / 360) / aspect);
  return (halfAngle * 360) / Math.PI;
}
