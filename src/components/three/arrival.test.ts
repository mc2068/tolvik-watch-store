import { describe, expect, test } from "vitest";

import { arrivalPose } from "@/components/three/arrival";

const steps = Array.from({ length: 1001 }, (_, step) => step / 1000);

describe("the arrival act", () => {
  test("opens on the watch turned away, set back and barely lit", () => {
    const pose = arrivalPose(0);

    // Dim, but never dark: the first screen always shows the watch.
    expect(pose.light).toBeGreaterThan(0);
    expect(pose.light).toBeLessThan(0.3);
    expect(pose.yaw).not.toBe(0);
    expect(pose.pitch).not.toBe(0);
    expect(pose.depth).toBeGreaterThan(0);
  });

  test("ends with the watch at rest in full light", () => {
    expect(arrivalPose(1)).toEqual({ light: 1, yaw: 0, pitch: 0, depth: 0 });
  });

  test("holds its first and last pose outside the act", () => {
    expect(arrivalPose(-0.5)).toEqual(arrivalPose(0));
    expect(arrivalPose(1.5)).toEqual(arrivalPose(1));
  });

  test("only ever brightens and comes closer as the Shopper scrolls on", () => {
    for (let i = 1; i < steps.length; i++) {
      const [before, after] = [
        arrivalPose(steps[i - 1]),
        arrivalPose(steps[i]),
      ];
      expect(after.light).toBeGreaterThanOrEqual(before.light);
      expect(after.depth).toBeLessThanOrEqual(before.depth);
    }
  });

  test("never jumps, so scrolling back plays it in reverse", () => {
    const start = arrivalPose(0);
    for (let i = 1; i < steps.length; i++) {
      const [before, after] = [
        arrivalPose(steps[i - 1]),
        arrivalPose(steps[i]),
      ];
      // A thousandth of the act moves nothing by more than a hundredth of
      // the distance it travels over the whole act.
      for (const key of ["light", "yaw", "pitch", "depth"] as const) {
        const travel = Math.abs(start[key] - arrivalPose(1)[key]);
        expect(Math.abs(after[key] - before[key])).toBeLessThan(travel / 100);
      }
    }
  });
});
