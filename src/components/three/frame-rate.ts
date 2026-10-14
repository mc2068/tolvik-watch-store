// Whether a device can hold a steady frame rate on a scene, judged from the
// gaps between the frames it draws. A scene is first judged with every frame
// asked for, behind its Still; found steady, it is shown and watched for as
// long as it lives. A scene found unsteady is dropped for its Still.

export const FRAME_RATE = {
  /** The first frames, while the scene is set up, which are not judged. */
  warmUp: 10,
  /** How many frames a judgement is made on. */
  sample: 40,
  /** The slowest a steady scene's frames come, in milliseconds: 20 a second. */
  slowest: 50,
  /**
   * The longest gap, in milliseconds, between two frames of a scene that is
   * moving. Longer, the scene was resting: one that draws only when asked
   * draws once a second, for the tick, and nothing at all off screen.
   */
  pause: 250,
} as const;

export type FrameRateVerdict = "judging" | "steady" | "unsteady";

export type FrameRateJudge = {
  /** The verdict so far. */
  readonly verdict: FrameRateVerdict;
  /** Records the gap before a frame, in milliseconds, and gives the verdict. */
  record(gap: number): FrameRateVerdict;
};

/**
 * A judge of one scene's frame rate. Steady means at least half of the last
 * sample of frames came no slower than `slowest`, so a few hiccups are
 * forgiven and a device that has slowed is not.
 */
export function judgeFrameRate(): FrameRateJudge {
  let verdict: FrameRateVerdict = "judging";
  let seen = 0;
  // The most recent gaps judged, oldest first.
  const recent: number[] = [];

  const tooSlow = () =>
    recent.filter((gap) => gap > FRAME_RATE.slowest).length >
    FRAME_RATE.sample / 2;

  return {
    get verdict() {
      return verdict;
    },

    record(gap) {
      if (verdict === "unsteady") return verdict;
      seen += 1;
      if (seen <= FRAME_RATE.warmUp) return verdict;
      // While the scene is first judged every frame is asked for, so a long
      // gap is the device being slow. Once it is shown, it is the scene at
      // rest.
      if (verdict === "steady" && gap > FRAME_RATE.pause) return verdict;

      recent.push(gap);
      if (recent.length > FRAME_RATE.sample) recent.shift();

      if (tooSlow()) verdict = "unsteady";
      else if (recent.length === FRAME_RATE.sample) verdict = "steady";
      return verdict;
    },
  };
}
