"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { ActFrame } from "@/components/home/ActFrame";
import { useActScore } from "@/components/home/use-act-score";
import { type Part, PARTS } from "@/components/three/hero-model";
import { partLabels } from "@/lib/part-labels";

const PART_NAMES: Record<Part, string> = {
  crystal: "Crystal",
  hands: "Hands",
  dial: "Dial",
  "dial-base": "Dial base",
  case: "Case",
  "crown-and-pushers": "Crown and pushers",
  bracelet: "Bracelet",
};

/**
 * The Exploded View act, the peak of Home: the Hero Timepiece lies down and
 * lifts apart, each of its seven parts is named beside it, and it closes
 * again as its price and the way to it arrive.
 */
export function ExplodedView({
  price,
  href,
}: {
  /** The Hero Timepiece's price, as it is shown. */
  price: string;
  /** The address of the Hero Timepiece's own page. */
  href: string;
}) {
  const act = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const names = useRef(new Map<Part, HTMLLIElement>());

  // Whether the 3D scene is on the page and saying where each part is. This
  // flips once, when the scene arrives or goes; the places themselves change
  // on every frame and never pass through React.
  const placed = useSyncExternalStore(
    partLabels.onChange,
    () => partLabels.get() !== null,
    () => false,
  );

  useActScore("exploded-view", act, { start: "top bottom" }, (score) => {
    // The statement gives way before the watch closes and the price comes.
    score.to(intro.current, { opacity: 0, duration: 0.06 }, 0.58);
  });

  // With a scene, each name follows its part: the scene says where on the
  // Stage it belongs and how much of it to show, and the name is moved there.
  useEffect(() => {
    if (!placed) return;

    const follow = () => {
      const labels = partLabels.get();
      if (!labels) return;
      for (const [part, name] of names.current) {
        const { x, y, shown } = labels[part];
        name.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
        name.style.opacity = String(shown);
      }
    };
    follow();
    return partLabels.onChange(follow);
  }, [placed]);

  // One list, set two ways. Beside a live watch it is laid over the watch's
  // box, a name to each part. Without one it is a line of names under the
  // statement.
  const parts = (
    <ol
      aria-label="The seven parts, front to back"
      className={
        placed
          ? "watch-box pointer-events-none"
          : "mt-6 flex flex-wrap gap-x-5 gap-y-1 text-small tracking-open text-platinum-dim"
      }
    >
      {PARTS.map((part) => (
        <li
          key={part}
          ref={(name) => {
            if (name) names.current.set(part, name);
            else names.current.delete(part);
          }}
          className={placed ? "absolute top-0 left-0 opacity-0" : undefined}
        >
          {placed ? (
            // The name starts where the scene points, after a short rule
            // that leads the eye back to the part. A phone has less room
            // beside the watch, so a long name takes two lines there.
            <span className="absolute top-0 left-0 flex w-max -translate-y-1/2 items-center gap-3 text-small leading-tight tracking-open text-platinum">
              <span
                aria-hidden="true"
                className="h-px w-6 shrink-0 bg-platinum-faint"
              />
              <span className="max-w-24 lg:max-w-none">{PART_NAMES[part]}</span>
            </span>
          ) : (
            PART_NAMES[part]
          )}
        </li>
      ))}
    </ol>
  );

  return (
    <section
      ref={act}
      aria-labelledby="exploded-view-heading"
      className="relative h-act-exploded-view motion-reduce:h-auto"
    >
      <ActFrame held>
        <div ref={intro}>
          <h2
            id="exploded-view-heading"
            className="font-display text-title text-balance"
          >
            Built in seven layers.
          </h2>
          <p className="mt-4 max-w-measure text-lead text-platinum-dim md:mt-6">
            Each one has a single job. Together they keep the time dry, legible
            and on your wrist.
          </p>
          {!placed && parts}
        </div>
        {placed && parts}
      </ActFrame>

      {/* The offer is the last screen of the act and scrolls up into place
          over the held frame, so the browser brings it into view, with the
          watch closed, for a Shopper who reaches its link by keyboard. */}
      <div className="motion-safe:absolute motion-safe:inset-x-0 motion-safe:bottom-0">
        <ActFrame>
          <p className="font-display text-display">{price}</p>
          <p className="mt-4 max-w-measure text-lead text-platinum-dim md:mt-6">
            In steel on a steel bracelet, with a deep blue dial.
          </p>
          {/* The Timepiece's page is not built yet, so Next must not fetch
              it ahead of the click; remove `prefetch={false}` once it is. */}
          <Link
            href={href}
            prefetch={false}
            className="mt-8 inline-flex h-12 items-center border border-platinum-dim px-7 text-small tracking-open text-platinum transition-colors duration-(--duration-quick) ease-settle hover:border-steel hover:text-steel"
          >
            View the Timepiece
          </Link>
        </ActFrame>
      </div>
    </section>
  );
}
