import { describe, expect, test } from "vitest";

import { handAngles } from "@/components/three/clock";

describe("the Clock", () => {
  test("stands every hand on twelve at midnight", () => {
    expect(handAngles({ hours: 0, minutes: 0, seconds: 0 })).toEqual({
      "hour-hand": 0,
      "minute-hand": 0,
      "second-hand": 0,
    });
  });

  test("stands every hand on twelve again at noon", () => {
    expect(handAngles({ hours: 12, minutes: 0, seconds: 0 })).toEqual({
      "hour-hand": 0,
      "minute-hand": 0,
      "second-hand": 0,
    });
  });

  test("lets the hour hand drift towards the next hour as the minutes pass", () => {
    // Half past three: halfway from the three to the four.
    expect(handAngles({ hours: 3, minutes: 30, seconds: 0 })).toEqual({
      "hour-hand": 105,
      "minute-hand": 180,
      "second-hand": 0,
    });
    // A quarter to nine in the evening: three quarters of the way to the nine.
    expect(
      handAngles({ hours: 20, minutes: 45, seconds: 0 })["hour-hand"],
    ).toBe(262.5);
  });

  test("carries the seconds into the minute and hour hands", () => {
    // Half a minute past six: the minute hand is halfway to the first mark,
    // and the hour hand a hundred and twentieth of the way to the seven.
    const angles = handAngles({ hours: 6, minutes: 0, seconds: 30 });

    expect(angles["second-hand"]).toBe(180);
    expect(angles["minute-hand"]).toBe(3);
    expect(angles["hour-hand"]).toBe(180.25);
  });

  test("ticks the second hand from one mark to the next, sixty to the turn", () => {
    const marks = Array.from(
      { length: 60 },
      (_, seconds) =>
        handAngles({ hours: 9, minutes: 41, seconds })["second-hand"],
    );

    expect(marks[1]).toBe(6);
    expect(marks[15]).toBe(90);
    expect(marks[59]).toBe(354);
    for (let second = 1; second < marks.length; second++) {
      expect(marks[second] - marks[second - 1]).toBe(6);
    }
  });

  test("never turns a hand past a full circle, even a second before midnight", () => {
    const angles = handAngles({ hours: 23, minutes: 59, seconds: 59 });

    expect(angles["second-hand"]).toBe(354);
    expect(angles["minute-hand"]).toBeCloseTo(359.9, 10);
    expect(angles["hour-hand"]).toBeGreaterThan(359.99);
    expect(angles["hour-hand"]).toBeLessThan(360);
  });
});
