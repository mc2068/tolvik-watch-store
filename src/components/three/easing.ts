// The shapes the acts' moves take. Each maps 0..1 to 0..1.

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Fast at first, then slowing: most of the way is covered early. */
export const slowToRest = (t: number) => 1 - (1 - t) ** 3;

/** Slow at both ends: a move that starts and stops gently. */
export const swell = (t: number) => t * t * (3 - 2 * t);

/** How far through a stretch of progress: 0 before it, 1 after it. */
export const through = (
  [from, to]: readonly [number, number],
  progress: number,
) => clamp01((progress - from) / (to - from));
