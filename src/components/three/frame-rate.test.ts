import { describe, expect, test } from "vitest";

import { FRAME_RATE, judgeFrameRate } from "@/components/three/frame-rate";

const { warmUp, sample, slowest } = FRAME_RATE;

/** Records each gap in turn and returns the verdict after the last. */
function recordAll(judge: ReturnType<typeof judgeFrameRate>, gaps: number[]) {
  let verdict = judge.verdict;
  for (const gap of gaps) verdict = judge.record(gap);
  return verdict;
}

const frames = (count: number, gap: number) => Array<number>(count).fill(gap);

describe("judging a scene's frame rate", () => {
  test("is still judging until it has seen a full sample", () => {
    const judge = judgeFrameRate();

    expect(judge.verdict).toBe("judging");
    expect(recordAll(judge, frames(warmUp + sample - 1, 16))).toBe("judging");
  });

  test("finds a scene steady that draws at sixty frames a second", () => {
    const judge = judgeFrameRate();

    expect(recordAll(judge, frames(warmUp + sample, 16.7))).toBe("steady");
  });

  test("finds a scene unsteady that draws at ten frames a second", () => {
    const judge = judgeFrameRate();

    expect(recordAll(judge, frames(warmUp + sample, 100))).toBe("unsteady");
  });

  test("forgives the first frames, while the scene is still being set up", () => {
    const judge = judgeFrameRate();

    // Compiling the shaders and uploading the model can take most of a
    // second, once.
    recordAll(judge, frames(warmUp, 800));
    expect(recordAll(judge, frames(sample, 16.7))).toBe("steady");
  });

  test("forgives a few slow frames among many quick ones", () => {
    const judge = judgeFrameRate();
    recordAll(judge, frames(warmUp, 16.7));

    const hiccups = frames(sample / 2 - 1, 120);
    const quick = frames(sample - hiccups.length, 16.7);
    expect(recordAll(judge, [...hiccups, ...quick])).toBe("steady");
  });

  test("gives up as soon as most of the sample is too slow, not after all of it", () => {
    const judge = judgeFrameRate();
    recordAll(judge, frames(warmUp, 16.7));

    // A device at two frames a second would take twenty seconds to fill a
    // sample; it is judged once more than half of it has come too slowly.
    expect(recordAll(judge, frames(sample / 2, 500))).toBe("judging");
    expect(judge.record(500)).toBe("unsteady");
  });

  test("counts a long gap against the scene", () => {
    // Every frame is asked for while the scene is judged, so a long gap is
    // the device being slow, not the scene resting.
    const judge = judgeFrameRate();
    recordAll(judge, frames(warmUp, 16.7));

    expect(recordAll(judge, frames(sample, 500))).toBe("unsteady");
  });

  test("draws the line at the slowest steady frame", () => {
    const atTheLine = judgeFrameRate();
    expect(recordAll(atTheLine, frames(warmUp + sample, slowest))).toBe(
      "steady",
    );

    const overIt = judgeFrameRate();
    expect(recordAll(overIt, frames(warmUp + sample, slowest + 1))).toBe(
      "unsteady",
    );
  });
});

describe("a verdict once given", () => {
  // A scene found steady is shown and draws only when asked, so the gaps
  // between its frames from then on are its rests, not the device's speed.
  test("stands for a scene found steady, however slowly it draws later", () => {
    const judge = judgeFrameRate();
    recordAll(judge, frames(warmUp + sample, 16.7));

    expect(recordAll(judge, frames(sample * 2, 120))).toBe("steady");
  });

  test("stands for a scene found unsteady, however quickly it draws later", () => {
    const judge = judgeFrameRate();
    recordAll(judge, frames(warmUp + sample, 100));

    expect(recordAll(judge, frames(sample * 2, 16.7))).toBe("unsteady");
  });
});
