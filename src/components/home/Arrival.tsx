"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import { actProgress } from "@/lib/act-progress";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The arrival act: the first screen of Home. Its copy is ordinary text that
 * scrolls away; behind it the Hero Timepiece comes out of the dark.
 */
export function Arrival() {
  const act = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  // `useGSAP` is GSAP's version of `useEffect`: it runs once the section is
  // on the page and undoes everything it set up when the section leaves.
  // A Shopper who prefers reduced motion gets none of it: the copy stays put
  // and the Stage shows a Still.
  useGSAP(() => {
    const motion = gsap.matchMedia();

    motion.add("(prefers-reduced-motion: no-preference)", () => {
      // The act's score. ScrollTrigger moves `played` from 0 to 1 over the
      // act's length, a little behind the Shopper's hand so a notched mouse
      // wheel still reads as one movement, and plays it backwards on the way
      // up. The value goes to the scene's store, never into React state.
      const played = { progress: 0 };

      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: act.current,
            // The act opens the page, so it starts at the very top and ends
            // when its last line reaches the foot of the screen.
            start: 0,
            end: "bottom bottom",
            scrub: 0.5,
          },
        })
        // The watch has arrived four fifths of the way through, and holds
        // there for the rest, so it is seen at rest before the Stage leaves.
        .to(played, {
          progress: 1,
          duration: 0.8,
          onUpdate: () => actProgress.set("arrival", played.progress),
        })
        // The copy gives way to the watch before it has scrolled off.
        .to(copy.current, { opacity: 0, duration: 0.3 }, 0.1)
        .set({}, {}, 1);

      return () => actProgress.set("arrival", 0);
    });
  });

  return (
    <section
      ref={act}
      aria-labelledby="arrival-headline"
      className="h-act-arrival"
    >
      <div
        ref={copy}
        className="page-frame flex min-h-first-screen flex-col justify-end pb-12 lg:justify-center lg:pb-0"
      >
        {/* On a laptop the copy keeps to the left half; the watch has the
            right. */}
        <div className="pointer-events-auto lg:max-w-1/2">
          <h1
            id="arrival-headline"
            className="max-w-statement font-display text-display text-balance"
          >
            The hour, in steel.
          </h1>
          <p className="mt-6 max-w-measure text-lead text-platinum-dim md:mt-8">
            A steel case, a steel bracelet and a deep blue dial under sapphire.
            Nothing on it that does not help you read the time.
          </p>
        </div>
      </div>
    </section>
  );
}
