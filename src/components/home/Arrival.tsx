"use client";

import { useRef } from "react";

import { useActScore } from "@/components/home/use-act-score";

/**
 * The arrival act: the first screen of Home. Its copy is ordinary text that
 * scrolls away; behind it the Hero Timepiece comes out of the dark.
 */
export function Arrival() {
  const act = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  // The act opens the page, so it starts at the very top. The watch has
  // arrived four fifths of the way through, and holds there for the rest, so
  // it is seen at rest before it turns.
  useActScore("arrival", act, { start: 0, over: 0.8 }, (score) => {
    // The copy gives way to the watch before it has scrolled off.
    score.to(copy.current, { opacity: 0, duration: 0.3 }, 0.1);
  });

  return (
    <section
      ref={act}
      aria-labelledby="arrival-headline"
      className="h-act-arrival motion-reduce:max-lg:h-stage"
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
