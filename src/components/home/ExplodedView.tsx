"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { ActFrame } from "@/components/home/ActFrame";
import { useActScore } from "@/components/home/use-act-score";
import { EXPLODED_VIEW_CLOSES } from "@/components/three/exploded-view";
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

const PARTS_LABEL = "The seven parts, front to back";

// How long the statement takes to give way, as a share of the act.
const STATEMENT_FADE = 0.06;

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
  /** Where the call to action leads. */
  href: string;
}) {
  const act = useRef<HTMLElement>(null);
  const statement = useRef<HTMLDivElement>(null);

  // Whether the 3D scene is on the page and saying where each part is. This
  // flips once, when the scene arrives or goes; the places themselves change
  // on every frame and never pass through React.
  const placed = useSyncExternalStore(
    partLabels.onChange,
    () => partLabels.get() !== null,
    () => false,
  );

  useActScore("exploded-view", act, { start: "top bottom" }, (score) => {
    // The statement has gone by the time the watch begins to close.
    score.to(
      statement.current,
      { opacity: 0, duration: STATEMENT_FADE },
      EXPLODED_VIEW_CLOSES[0] - STATEMENT_FADE,
    );
  });

  // One list of names, set two ways: beside a live watch, a name to each
  // part, or without one, a line of names under the statement.
  return (
    <section
      ref={act}
      aria-labelledby="exploded-view-heading"
      className="relative h-act-exploded-view motion-reduce:h-auto"
    >
      <ActFrame held>
        <div ref={statement}>
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
          {!placed && <NamesInALine />}
        </div>
        {placed && <NamesBesideTheParts />}
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
          {/* The page this leads to is not built yet, so Next must not fetch
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

/** The names with no scene to place them: a line under the statement. */
function NamesInALine() {
  return (
    <ol
      aria-label={PARTS_LABEL}
      className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-small tracking-open text-platinum-dim"
    >
      {PARTS.map((part) => (
        <li key={part}>{PART_NAMES[part]}</li>
      ))}
    </ol>
  );
}

/**
 * The names beside a live watch. The list is laid over the watch's box and
 * each name follows its part: the scene says where on the screen it belongs
 * and how much of it to show, and the name is moved there.
 */
function NamesBesideTheParts() {
  const list = useRef<HTMLOListElement>(null);
  const items = useRef(new Map<Part, HTMLLIElement>());

  useEffect(() => {
    const follow = () => {
      const labels = partLabels.get();
      if (!labels || !list.current) return;
      // The scene speaks in the screen's pixels and the names are moved in
      // the list's own, so the list is measured each time. The two need not
      // line up: the act's frame is still on its way up to the Stage, or
      // already leaving it, at either end of a brisk scroll.
      const { left, top } = list.current.getBoundingClientRect();
      for (const [part, item] of items.current) {
        const { x, y, shown } = labels[part];
        item.style.transform = `translate3d(${Math.round(x - left)}px, ${Math.round(y - top)}px, 0)`;
        item.style.opacity = String(shown);
      }
    };
    follow();
    return partLabels.onChange(follow);
  }, []);

  return (
    <ol
      ref={list}
      aria-label={PARTS_LABEL}
      className="watch-box pointer-events-none"
    >
      {PARTS.map((part) => (
        <li
          key={part}
          ref={(item) => {
            if (item) items.current.set(part, item);
            else items.current.delete(part);
          }}
          className="absolute top-0 left-0 opacity-0"
        >
          {/* The name starts where the scene points, after a short rule
              that leads the eye back to the part. A phone has less room
              beside the watch, so a long name takes two lines there. */}
          <span className="absolute top-0 left-0 flex w-max -translate-y-1/2 items-center gap-3 text-small leading-tight tracking-open text-platinum">
            <span
              aria-hidden="true"
              className="h-px w-6 shrink-0 bg-platinum-faint"
            />
            <span className="max-w-24 lg:max-w-none">{PART_NAMES[part]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
