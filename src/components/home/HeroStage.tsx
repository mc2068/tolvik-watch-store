"use client";

import dynamic from "next/dynamic";
import { getImageProps } from "next/image";
import {
  Component,
  type ReactNode,
  useState,
  useSyncExternalStore,
} from "react";

import { HERO_STILL } from "@/components/three/hero-model";
import { actProgress } from "@/lib/act-progress";
import type { Finish } from "@/lib/catalogue";

// `next/dynamic` with `ssr: false` keeps the 3D code out of the server's HTML
// and out of the page's first download: the browser fetches it only after
// the page is showing, and nothing renders in its place meanwhile.
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
});

const MOTION_WELCOME = "(prefers-reduced-motion: no-preference)";

let canDraw: boolean | undefined;

/** Whether this browser can draw 3D at all. Asked once, in the browser. */
function browserCanDraw3D(): boolean {
  if (canDraw === undefined) {
    const context = document.createElement("canvas").getContext("webgl2");
    canDraw = context !== null;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return canDraw;
}

const subscribeToNothing = () => () => {};

function subscribeToMotionPreference(onChange: () => void) {
  const preference = window.matchMedia(MOTION_WELCOME);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

/**
 * The Stage: where the Hero Timepiece stands on Home. It opens as a Still,
 * loads the 3D scene behind it, and swaps the two once the watch has been
 * drawn. A Shopper who prefers reduced motion, a browser that cannot draw
 * 3D and a scene that fails or is dropped all keep a Still.
 */
export function HeroStage({ finish }: { finish: Finish }) {
  // `useSyncExternalStore` reads something that lives outside React. Its
  // third argument is the answer on the server and while the page hydrates,
  // where neither question can be asked yet: null, not known.
  const supported = useSyncExternalStore(
    subscribeToNothing,
    browserCanDraw3D,
    () => null,
  );
  const motionWelcome = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(MOTION_WELCOME).matches,
    () => null,
  );
  const [drawn, setDrawn] = useState(false);
  const [failed, setFailed] = useState(false);
  // Whether the watch has begun to turn away. The act's progress changes on
  // every frame; this reading of it changes once, as the turn act begins.
  const turning = useSyncExternalStore(
    actProgress.onChange,
    () => actProgress.get("turn") > 0,
    () => false,
  );

  const live = supported === true && motionWelcome === true && !failed;
  const state = !live ? "still" : drawn ? "ready" : "loading";

  return (
    <div className="watch-box">
      <div
        role="img"
        aria-label="The Tolvik watch in steel, with a deep blue dial"
        data-hero-timepiece={state}
        className="absolute inset-0"
      >
        <HeroStill
          awaiting3D={supported !== false && !failed}
          hidden={state === "ready"}
        />

        {live && (
          <SceneBoundary onError={() => setFailed(true)}>
            <div
              className={`absolute inset-0 transition-opacity duration-(--duration-calm) ease-settle ${drawn ? "" : "opacity-0"}`}
            >
              <HeroScene
                finish={finish}
                onReady={() => setDrawn(true)}
                onLost={() => setFailed(true)}
              />
            </div>
          </SceneBoundary>
        )}
      </div>

      <p
        role="status"
        className="pointer-events-none absolute inset-x-0 top-6 flex items-center justify-center gap-3 text-small tracking-open text-platinum-dim lg:top-auto lg:bottom-10"
      >
        {state === "loading" && (
          <>
            <span aria-hidden="true" className="flex gap-0.75">
              <span className="h-4 w-0.5 animate-tick bg-steel motion-reduce:animate-none" />
              <span className="h-4 w-0.5 animate-tock bg-steel motion-reduce:animate-none" />
            </span>
            Loading the watch
          </>
        )}
        {/* The invitation to drag is for the watch as it arrives. Once it
            turns away the line steps aside: on a phone it would lie across
            the open watch. */}
        {state === "ready" && (
          <span
            className={`transition-opacity duration-(--duration-calm) ease-settle ${turning ? "opacity-0" : ""}`}
          >
            Drag to look around
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * The Still in the watch's place. There are two. A Shopper about to get the
 * 3D sees the opening frame of the arrival act, so that when the canvas
 * takes over only the hands move, from the Still's ten past ten to the
 * Shopper's own time. Everyone else sees the watch arrived and lit:
 * the browser picks it by itself when reduced motion is preferred, and
 * `awaiting3D` turns false when the 3D will never come.
 */
function HeroStill({
  awaiting3D,
  hidden,
}: {
  awaiting3D: boolean;
  hidden: boolean;
}) {
  // `getImageProps` gives what `next/image` would put on its <img>: resized
  // copies of the file for each screen width, in a modern format.
  const still = (src: string) =>
    getImageProps({
      src,
      alt: "",
      fill: true,
      sizes: "(min-width: 64rem) 60vw, 100vw",
      quality: 90,
      loading: "eager",
      fetchPriority: "high",
    }).props;
  const opening = still(HERO_STILL.opening);
  const arrived = still(HERO_STILL.arrived);

  return (
    <picture>
      {awaiting3D && (
        <source
          media={MOTION_WELCOME}
          srcSet={opening.srcSet}
          sizes={opening.sizes}
        />
      )}
      <img
        {...arrived}
        alt=""
        className={`object-contain transition-opacity duration-(--duration-calm) ease-settle ${hidden ? "opacity-0" : ""}`}
      />
    </picture>
  );
}

type SceneBoundaryProps = { onError: () => void; children: ReactNode };

/**
 * An error boundary: React's way to catch a component that throws while
 * rendering. If the scene fails, it is dropped and the Still stays.
 */
class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
