import { expect, test } from "vitest";

import { containFov, distanceToFit } from "@/components/three/framing";

test("a wide or square stage keeps the lens it was given", () => {
  expect(containFov(30, 1)).toBe(30);
  expect(containFov(30, 16 / 9)).toBe(30);
});

test("a tall stage widens the lens until the same square fits its width", () => {
  // A 90 degree lens sees a square as wide as it is far away. At half the
  // width, the upright angle that still fits that square is 2 x atan(2).
  expect(containFov(90, 0.5)).toBeCloseTo(126.87, 2);
});

test("the lens changes smoothly as the stage passes through square", () => {
  expect(containFov(30, 0.999)).toBeCloseTo(containFov(30, 1), 1);
});

// A 90 degree lens sees a square twice as wide as it is far away.
test("a square stage fits whichever of height and width needs more room", () => {
  expect(distanceToFit({ width: 1, height: 2 }, 90, 1)).toBeCloseTo(1);
  expect(distanceToFit({ width: 2, height: 1 }, 90, 1)).toBeCloseTo(1);
});

test("a wide stage has room to spare at its sides", () => {
  expect(distanceToFit({ width: 4, height: 2 }, 90, 2)).toBeCloseTo(1);
  expect(distanceToFit({ width: 1, height: 2 }, 90, 2)).toBeCloseTo(1);
});

test("a tall stage has room to spare above and below", () => {
  expect(distanceToFit({ width: 2, height: 4 }, 90, 0.5)).toBeCloseTo(1);
  expect(distanceToFit({ width: 2, height: 1 }, 90, 0.5)).toBeCloseTo(1);
});
