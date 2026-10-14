// Whether a device can hold a steady frame rate on a scene, judged from the
// gaps between the frames it draws. A scene is judged once, as it loads,
// with every frame asked for, behind its Still: found steady it is shown,
// and found unsteady it is dropped for its Still. Once shown, a scene draws
// only when asked, so the gaps after that are its rests and say nothing.

export const FRAME_RATE = {
  /** The first frames, while the scene is set up, which are not judged. */
  warmUp: 10,
  /** How many frames a judgement is made on. */
  sample: 40,
  /** The slowest a steady scene's frames come, in milliseconds: 20 a second. */
  slowest: 50,
} as const;

export type FrameRateVerdict = "judging" | "steady" | "unsteady";

export type FrameRateJudge = {
  /** The verdict so far. */
  readonly verdict: FrameRateVerdict;
  /** Records the gap before a frame, in milliseconds, and gives the verdict. */
  record(gap: number): FrameRateVerdict;
};

/**
 * A judge of one scene's frame rate. Steady means at least half of a sample
 * of frames came no slower than `slowest`, so a few hiccups are forgiven.
 * It gives up early on a device too slow to fill the sample in good time:
 * once more than half of it has come too slowly, the verdict is already
 * clear. A verdict, once given, stands.
 */
export function judgeFrameRate(): FrameRateJudge {
  let verdict: FrameRateVerdict = "judging";
  let seen = 0;
  let judged = 0;
  let tooSlow = 0;

  return {
    get verdict() {
      return verdict;
    },

    record(gap) {
      if (verdict !== "judging") return verdict;
      seen += 1;
      if (seen <= FRAME_RATE.warmUp) return verdict;

      judged += 1;
      if (gap > FRAME_RATE.slowest) tooSlow += 1;

      if (tooSlow > FRAME_RATE.sample / 2) verdict = "unsteady";
      else if (judged === FRAME_RATE.sample) verdict = "steady";
      return verdict;
    },
  };
}
