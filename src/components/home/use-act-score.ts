import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

import { type Act, actProgress } from "@/lib/act-progress";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * An act's score: a timeline one unit long that scroll plays over the act's
 * section, forwards on the way down and backwards on the way up, a little
 * behind the Shopper's hand so a notched mouse wheel still reads as one
 * movement. It moves the act's progress in the scene's store, never in React
 * state; `compose` adds what the act's own copy does, at times from 0 to 1.
 *
 * `useGSAP` is GSAP's version of `useEffect`: it runs once the section is on
 * the page and undoes everything it set up when the section leaves. A
 * Shopper who prefers reduced motion gets none of it: the copy stays put and
 * the Stage shows a Still.
 */
export function useActScore(
  act: Act,
  section: RefObject<HTMLElement | null>,
  {
    start,
    over = 1,
  }: {
    /** Where the act begins, as ScrollTrigger reads it. */
    start: ScrollTrigger.Vars["start"];
    /** The share of the act in which its progress runs out; it holds after. */
    over?: number;
  },
  compose: (score: gsap.core.Timeline) => void,
) {
  useGSAP(() => {
    const motion = gsap.matchMedia();

    motion.add("(prefers-reduced-motion: no-preference)", () => {
      // The act's progress, as a property the score moves and not a callback
      // it fires. Whenever ScrollTrigger measures the page again (a resized
      // window, a turned phone, the page finishing its load) it puts the
      // score where scroll says without firing its callbacks. A property is
      // written all the same, so the watch is never left where the score
      // happened to be at that moment.
      const played = {
        get progress() {
          return actProgress.get(act);
        },
        set progress(value: number) {
          actProgress.set(act, value);
        },
      };

      const score = gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section.current,
            start,
            // The act ends when its last line reaches the foot of the screen.
            end: "bottom bottom",
            scrub: 0.5,
          },
        })
        .to(played, { progress: 1, duration: over })
        .set({}, {}, 1);
      compose(score);

      return () => actProgress.set(act, 0);
    });
  });
}
