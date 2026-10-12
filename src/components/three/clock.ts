// The Clock: where the Hero Timepiece's three hands point at a given time.
// It is a pure function, so it can be checked without a watch or a browser;
// `use-clock.ts` feeds it the Shopper's own time.

import type { Hand } from "@/components/three/hero-model";

/** A time as a clock face shows it. */
export type TimeOfDay = {
  /** 0 to 23. */
  hours: number;
  /** 0 to 59. */
  minutes: number;
  /** 0 to 59, whole. */
  seconds: number;
};

/** Each hand's angle in degrees, clockwise from twelve. */
export function handAngles(time: TimeOfDay): Record<Hand, number> {
  // Counted in whole seconds, so no hand picks up a rounding error.
  const secondsPastTheHour = time.minutes * 60 + time.seconds;
  const secondsPastTwelve = (time.hours % 12) * 3600 + secondsPastTheHour;

  return {
    // Once round the dial in twelve hours, in one hour and in one minute.
    "hour-hand": secondsPastTwelve / 120,
    "minute-hand": secondsPastTheHour / 10,
    "second-hand": time.seconds * 6,
  };
}
