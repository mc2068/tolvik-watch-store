"use client";

import { createContext, type ReactNode, use, useState } from "react";

import type { Colourway } from "@/lib/catalogue";

type Choice = {
  /** Every Colourway there is to choose between. */
  colourways: Colourway[];
  /** The one the Shopper has chosen. */
  chosen: Colourway;
  choose: (colourway: Colourway) => void;
};

// A context is React's way to hand a value to components far down the page
// without passing it through everything in between. Here it is the Shopper's
// choice of Colourway, which the picker sets and the watch is drawn in.
const ChoiceContext = createContext<Choice | null>(null);

/**
 * Holds the Shopper's choice of Colourway for everything inside it. The
 * choice lives in this component's state, so it lasts as long as the page
 * is open and starts again from `initial` on the next visit.
 */
export function ColourwayChoice({
  colourways,
  initial,
  children,
}: {
  colourways: Colourway[];
  /** The slug of the Colourway shown before the Shopper chooses. */
  initial: string;
  children: ReactNode;
}) {
  const [slug, setSlug] = useState(initial);
  const chosen =
    colourways.find((colourway) => colourway.slug === slug) ?? colourways[0];

  return (
    <ChoiceContext
      value={{ colourways, chosen, choose: ({ slug }) => setSlug(slug) }}
    >
      {children}
    </ChoiceContext>
  );
}

/** The Shopper's choice of Colourway, anywhere inside a `ColourwayChoice`. */
export function useColourwayChoice(): Choice {
  // `use` reads the context's value, and renders the component again
  // whenever the `ColourwayChoice` above it holds a new one.
  const choice = use(ChoiceContext);
  if (!choice) throw new Error("There is no Colourway to choose here");
  return choice;
}
