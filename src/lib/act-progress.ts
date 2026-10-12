// How far along each Act the Shopper is, from 0 to 1. The Act's section on
// Home writes it as the page scrolls and the 3D scene's frame loop reads it.
// It is a plain object outside React on purpose: a value that changes on
// every scroll frame must not re-render components, or a mid-range phone
// stutters. It lives here, outside components/three, so that Home can write
// to it without loading any 3D code.

export type Act = "arrival";

const progress: Record<Act, number> = { arrival: 0 };
const listeners = new Set<() => void>();

export const actProgress = {
  get(act: Act): number {
    return progress[act];
  },

  set(act: Act, value: number): void {
    if (progress[act] === value) return;
    progress[act] = value;
    for (const listener of listeners) listener();
  },

  /** Calls `listener` whenever any Act moves. Returns the way to stop. */
  onChange(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
