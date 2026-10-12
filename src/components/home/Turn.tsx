"use client";

import { useRef } from "react";

import { ActFrame } from "@/components/home/ActFrame";
import { useActScore } from "@/components/home/use-act-score";

/**
 * The turn act: the Hero Timepiece turns to its profile while one short
 * statement about its side is held beside it.
 */
export function Turn() {
  const act = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  // The act starts as its section comes onto the screen, where the arrival
  // act ended, so the watch is never waiting for the next act to begin.
  useActScore("turn", act, { start: "top bottom" }, (score) => {
    // The copy has gone before its frame lets go, so on a phone it never
    // travels up across the watch.
    score.to(copy.current, { opacity: 0, duration: 0.1 }, 0.88);
  });

  return (
    <section
      ref={act}
      aria-labelledby="turn-heading"
      className="h-act-turn motion-reduce:h-auto"
    >
      <ActFrame held>
        <div ref={copy}>
          <h2 id="turn-heading" className="font-display text-title text-balance">
            A profile kept quiet.
          </h2>
          <p className="mt-4 max-w-measure text-lead text-platinum-dim md:mt-6">
            From the side there is little to see, and that is the point: a slim
            case, a crown that sits close, and a bracelet that follows the
            wrist.
          </p>
        </div>
      </ActFrame>
    </section>
  );
}
