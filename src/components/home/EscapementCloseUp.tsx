"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { ESCAPEMENT_STILL } from "@/components/three/escapement-model";
import {
  SceneBoundary,
  useCanDraw3D,
  useMotionWelcome,
} from "@/components/ui/live-3d";

const EscapementScene = dynamic(
  () => import("@/components/three/EscapementScene"),
  { ssr: false },
);

/**
 * The escapement at work, filling the box it is put in. It is its Still
 * until the page has scrolled to within a screen of it; then the 3D scene
 * loads behind the Still, and takes its place once it has drawn and the
 * device has shown it can keep up. The escapement plays only while it is on
 * screen. A Shopper who prefers reduced motion, a browser that cannot draw
 * 3D, a device that cannot hold a steady frame rate and a scene that fails
 * or is dropped all keep the Still.
 */
export function EscapementCloseUp({
  heldAt,
  className = "",
}: {
  /** Holds the escapement this far into its animation, in seconds. */
  heldAt?: number;
  className?: string;
}) {
  const supported = useCanDraw3D();
  const motionWelcome = useMotionWelcome();
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [failed, setFailed] = useState(false);

  // An IntersectionObserver tells the page when an element crosses into or
  // out of view, without anything run on every scroll. One loads the scene
  // a screen ahead; the other starts and stops the escapement.
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const ahead = new IntersectionObserver(
      (sightings) => {
        if (!sightings.at(-1)?.isIntersecting) return;
        setNear(true);
        ahead.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    const inView = new IntersectionObserver((sightings) =>
      setOnScreen(sightings.at(-1)?.isIntersecting ?? false),
    );
    ahead.observe(element);
    inView.observe(element);
    return () => {
      ahead.disconnect();
      inView.disconnect();
    };
  }, []);

  const live = supported === true && motionWelcome === true && !failed;
  const state = !live ? "still" : drawn ? "ready" : "loading";

  return (
    <div
      ref={box}
      role="img"
      aria-label="A Swiss lever escapement at work: the balance wheel swings on its hairspring, and the escape wheel turns a tooth at a time."
      data-escapement={state}
      className={`relative ${className}`}
    >
      {/* Photographed against the page's own black, so `lighten` lets it
          stand on the page with no edge around it, as a listing's Stills
          do. It is as wide as the scene's view is, so `contain` lays the
          escapement exactly where the scene will draw it, at any shape. */}
      <Image
        src={ESCAPEMENT_STILL}
        alt=""
        fill
        sizes="(min-width: 90rem) 82rem, 100vw"
        quality={90}
        className={`object-contain mix-blend-lighten transition-opacity duration-(--duration-calm) ease-settle ${state === "ready" ? "opacity-0" : ""}`}
      />

      {live && near && (
        <SceneBoundary onError={() => setFailed(true)}>
          <div
            className={`absolute inset-0 transition-opacity duration-(--duration-calm) ease-settle ${drawn ? "" : "opacity-0"}`}
          >
            <EscapementScene
              running={onScreen}
              heldAt={heldAt}
              onReady={() => setDrawn(true)}
              onDropped={() => setFailed(true)}
            />
          </div>
        </SceneBoundary>
      )}
    </div>
  );
}
