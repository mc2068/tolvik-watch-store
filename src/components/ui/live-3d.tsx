"use client";

import { Component, type ReactNode, useSyncExternalStore } from "react";

// What every real-time 3D scene on the site asks before it loads, and the
// net it is loaded in. A scene is a Still until the answers are known, and
// stays one for a Shopper who prefers reduced motion, a browser that cannot
// draw 3D and a scene that fails.

export const MOTION_WELCOME = "(prefers-reduced-motion: no-preference)";

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

// `useSyncExternalStore` reads something that lives outside React. Its
// third argument is the answer on the server and while the page hydrates,
// where neither question can be asked yet: null, not known.

/** Whether this browser can draw 3D, or null while that is not known. */
export function useCanDraw3D(): boolean | null {
  return useSyncExternalStore(subscribeToNothing, browserCanDraw3D, () => null);
}

/** Whether the Shopper welcomes motion, or null while that is not known. */
export function useMotionWelcome(): boolean | null {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(MOTION_WELCOME).matches,
    () => null,
  );
}

type SceneBoundaryProps = { onError: () => void; children: ReactNode };

/**
 * An error boundary: React's way to catch a component that throws while
 * rendering. If a scene fails, it is dropped and the Still stays.
 */
export class SceneBoundary extends Component<
  SceneBoundaryProps,
  { failed: boolean }
> {
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
