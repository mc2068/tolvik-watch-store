import { expect, test } from "vitest";

import { containFov } from "@/components/three/framing";

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
