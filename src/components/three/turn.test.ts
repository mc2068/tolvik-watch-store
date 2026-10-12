import { describe, expect, test } from "vitest";

import { turnPose } from "@/components/three/turn";

const steps = Array.from({ length: 1001 }, (_, step) => step / 1000);

describe("the turn act", () => {
  test("opens on the watch as the arrival act left it", () => {
    expect(turnPose(0)).toEqual({ turned: 0 });
  });

  test("ends with the watch in profile", () => {
    expect(turnPose(1)).toEqual({ turned: 1 });
  });

  test("holds its first and last pose outside the act", () => {
    expect(turnPose(-0.5)).toEqual(turnPose(0));
    expect(turnPose(1.5)).toEqual(turnPose(1));
  });

  test("shows the profile at rest before the act is over", () => {
    expect(turnPose(0.9)).toEqual(turnPose(1));
  });

  test("only ever turns one way as the Shopper scrolls on", () => {
    for (let i = 1; i < steps.length; i++) {
      expect(turnPose(steps[i]).turned).toBeGreaterThanOrEqual(
        turnPose(steps[i - 1]).turned,
      );
    }
  });

  test("never jumps, so scrolling back plays it in reverse", () => {
    for (let i = 1; i < steps.length; i++) {
      const [before, after] = [turnPose(steps[i - 1]), turnPose(steps[i])];
      // A thousandth of the act is never more than a hundredth of the turn.
      expect(Math.abs(after.turned - before.turned)).toBeLessThan(0.01);
    }
  });
});
