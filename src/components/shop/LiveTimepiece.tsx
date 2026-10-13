"use client";

import dynamic from "next/dynamic";
import { getImageProps } from "next/image";
import {
  Component,
  type ReactNode,
  useState,
  useSyncExternalStore,
} from "react";

import { HERO_OPENING_STILL } from "@/components/three/hero-model";
import { actProgress } from "@/lib/act-progress";
import type { Finish, Still } from "@/lib/catalogue";

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
 * A Timepiece in real-time 3D, filling the box it is put in: Home's Stage,
 * or the Hero Timepiece's frame on its own page. It opens as a Still, loads
 * the 3D scene behind it, and swaps the two once the watch has been drawn. A
 * Shopper who prefers reduced motion, a browser that cannot draw 3D and a
 * scene that fails or is dropped all keep a Still.
 */
export function LiveTimepiece({
  finish,
  still,
  arrived = false,
  statusClassName,
}: {
  /** The Finish the watch is made in. */
  finish: Finish;
  /** The Timepiece's Still in that Finish: the watch arrived and lit. */
  still: Still;
  /**
   * Whether the watch is held arrived and lit, on a page with no acts to
   * bring it in. Left out, it follows the acts, as on Home.
   */
  arrived?: boolean;
  /** Where in the box the line under the watch stands. */
  statusClassName: string;
}) {
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
    <>
      <div
        role="img"
        aria-label={still.alt}
        data-hero-timepiece={state}
        className="absolute inset-0"
      >
        <HeroStill
          arrived={still.src}
          // The acts open on a darker watch than the one that has arrived.
          opensDark={!arrived && supported !== false && !failed}
          hidden={state === "ready"}
        />

        {live && (
          <SceneBoundary onError={() => setFailed(true)}>
            <div
              className={`absolute inset-0 transition-opacity duration-(--duration-calm) ease-settle ${drawn ? "" : "opacity-0"}`}
            >
              <HeroScene
                finish={finish}
                arrived={arrived}
                onReady={() => setDrawn(true)}
                onLost={() => setFailed(true)}
              />
            </div>
          </SceneBoundary>
        )}
      </div>

      <p
        role="status"
        className={`pointer-events-none absolute inset-x-0 flex items-center justify-center gap-3 text-small tracking-open text-platinum-dim ${statusClassName}`}
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
    </>
  );
}

/**
 * The Still in the watch's place. Where the acts bring the watch in there
 * are two. A Shopper about to get the 3D sees the opening frame of the
 * arrival act, so that when the canvas takes over only the hands move, from
 * the Still's ten past ten to the Shopper's own time. Everyone else sees the
 * watch arrived and lit: the browser picks it by itself when reduced motion
 * is preferred, and `opensDark` is false when the 3D will never come, or
 * will come already arrived.
 */
function HeroStill({
  arrived,
  opensDark,
  hidden,
}: {
  arrived: string;
  opensDark: boolean;
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
  const opening = still(HERO_OPENING_STILL);
  const fallback = still(arrived);

  return (
    <picture>
      {opensDark && (
        <source
          media={MOTION_WELCOME}
          srcSet={opening.srcSet}
          sizes={opening.sizes}
        />
      )}
      <img
        {...fallback}
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
