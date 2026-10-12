// Where each Part's name goes in the Exploded View. The 3D scene works it
// out on every frame it draws and the act's section on Home moves the names
// there. Like the act progress beside it, this is a plain object outside
// React, so a name can follow its Part without re-rendering anything, and
// Home can read it without loading any 3D code.

import { type Part, PARTS } from "@/components/three/hero-model";

export type PartLabel = {
  /** Where the name goes, in pixels from the left and top of the screen. */
  x: number;
  y: number;
  /** How much of the name shows: 0 none, while the watch is closed, 1 all. */
  shown: number;
};

const labels = Object.fromEntries(
  PARTS.map((part) => [part, { x: 0, y: 0, shown: 0 }]),
) as Record<Part, PartLabel>;
let placed = false;
const listeners = new Set<() => void>();

const tell = () => {
  for (const listener of listeners) listener();
};

export const partLabels = {
  /** The labels as the scene last placed them, or null with no scene. */
  get(): Readonly<Record<Part, PartLabel>> | null {
    return placed ? labels : null;
  },

  /** The scene's side: `fill` sets each label, then Home is told. */
  place(fill: (part: Part, label: PartLabel) => void): void {
    for (const part of PARTS) fill(part, labels[part]);
    placed = true;
    tell();
  },

  /** The scene has gone, and its labels with it. */
  clear(): void {
    if (!placed) return;
    placed = false;
    tell();
  },

  /** Calls `listener` whenever the labels move. Returns the way to stop. */
  onChange(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
