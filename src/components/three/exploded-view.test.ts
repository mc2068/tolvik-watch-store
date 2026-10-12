import { describe, expect, test } from "vitest";

import { partOffsets, partSeparation } from "@/components/three/exploded-view";
import { PARTS } from "@/components/three/hero-model";

const steps = Array.from({ length: 1001 }, (_, step) => step / 1000);

describe("the Exploded View's layout", () => {
  test("has every part at rest when the watch is closed", () => {
    const offsets = partOffsets(0);

    for (const part of PARTS) expect(Math.abs(offsets[part])).toBe(0);
  });

  test("has every part at its full offset when the watch is apart", () => {
    const apart = partOffsets(1);

    // Clear air between each part and the next, front to back.
    for (let i = 1; i < PARTS.length; i++) {
      expect(apart[PARTS[i - 1]] - apart[PARTS[i]]).toBeGreaterThan(0.25);
    }
    // No part is ever further from rest than it is here.
    for (const progress of steps) {
      const offsets = partOffsets(progress);
      for (const part of PARTS) {
        expect(Math.abs(offsets[part])).toBeLessThanOrEqual(
          Math.abs(apart[part]),
        );
      }
    }
  });

  test("holds its closed and its full layout outside the range", () => {
    expect(partOffsets(-0.5)).toEqual(partOffsets(0));
    expect(partOffsets(1.5)).toEqual(partOffsets(1));
  });

  test("keeps the parts in one order along the axis, front to back", () => {
    for (const progress of steps) {
      const offsets = partOffsets(progress);
      for (let i = 1; i < PARTS.length; i++) {
        expect(offsets[PARTS[i - 1]]).toBeGreaterThanOrEqual(
          offsets[PARTS[i]],
        );
      }
    }
  });

  test("only ever moves a part away from rest as the watch comes apart", () => {
    for (let i = 1; i < steps.length; i++) {
      const [before, after] = [partOffsets(steps[i - 1]), partOffsets(steps[i])];
      for (const part of PARTS) {
        expect(Math.abs(after[part])).toBeGreaterThanOrEqual(
          Math.abs(before[part]),
        );
      }
    }
  });

  test("never jumps, so scrolling back closes the watch the way it opened", () => {
    const apart = partOffsets(1);
    for (let i = 1; i < steps.length; i++) {
      const [before, after] = [partOffsets(steps[i - 1]), partOffsets(steps[i])];
      // A thousandth of the way moves no part by more than a hundredth of
      // the distance it travels in all.
      for (const part of PARTS) {
        expect(Math.abs(after[part] - before[part])).toBeLessThanOrEqual(
          Math.abs(apart[part]) / 100,
        );
      }
    }
  });
});

describe("how far each part has left its place", () => {
  test("is nothing for a closed watch and everything for an open one", () => {
    for (const part of PARTS) {
      expect(partSeparation(0)[part]).toBe(0);
      expect(partSeparation(1)[part]).toBe(1);
    }
  });

  test("opens the watch from the outside in, the case last", () => {
    const early = partSeparation(0.3);
    const late = partSeparation(0.7);

    // The crystal and the bracelet, which travel furthest, set off first.
    expect(early.crystal).toBeGreaterThan(early.hands);
    expect(early.hands).toBeGreaterThan(early.dial);
    expect(early.bracelet).toBeGreaterThan(early["crown-and-pushers"]);
    // The case goes nowhere, and is counted out after everything else.
    expect(early.case).toBe(0);
    for (const part of PARTS) {
      expect(late[part]).toBeGreaterThanOrEqual(late.case);
    }
  });
});
