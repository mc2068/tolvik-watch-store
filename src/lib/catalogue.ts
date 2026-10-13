// The Catalogue: the only way anything reads Timepiece data. Pages, sections
// and scripts ask it; none of them opens `src/data` themselves.
//
// Today it answers from the sample data in the repo. Every function is
// async all the same, so that a real store can stand behind it later without
// a single caller changing.
//
// The two imports below are relative and carry their extension, unlike the
// rest of the app's, so that `npm run stills` can ask the Catalogue from
// Node as well.

import { collections } from "../data/collections.ts";
import { colourways, defaultColourway } from "../data/colourways.ts";
import { timepieces } from "../data/timepieces.ts";

/** A named group of Timepieces presented together. */
export type Collection = {
  slug: string;
  name: string;
  /** One line on what its Timepieces have in common. */
  description: string;
};

/** A single watch offered for sale. */
export type Timepiece = {
  slug: string;
  name: string;
  /** The slug of the Collection it belongs to. */
  collection: string;
  /** In whole US dollars. */
  price: number;
  description: string;
  specifications: Specifications;
  finish: Finish;
  /**
   * Its Stills, one of each view. The first, from the front, is the one a
   * listing shows.
   */
  stills: Still[];
  /** Whether this is the one Timepiece shown in real-time 3D. */
  isHero: boolean;
};

export type Specifications = {
  case: string;
  movement: string;
  powerReserve: string;
  waterResistance: string;
  crystal: string;
  bracelet: string;
  dial: string;
};

/**
 * How a Timepiece's surfaces are made, as the values the 3D model needs:
 * the dial plate's colour as a hex colour, and whether the steel of the case
 * and of the bracelet is left bare or blackened.
 */
export type Finish = {
  dial: string;
  case: Steel;
  bracelet: Steel;
};

export type Steel = "bare" | "blackened";

/**
 * One combination of dial colour and bracelet in which the Hero Timepiece
 * can be shown and bought.
 */
export type Colourway = {
  slug: string;
  /** The whole choice in words, as "Deep blue dial, brushed steel bracelet". */
  name: string;
  /** The name of its dial colour, which it shares with one other Colourway. */
  dial: string;
  /** The name of its bracelet, which it shares with two others. */
  bracelet: string;
  /** The Hero Timepiece's Finish in this Colourway. */
  finish: Finish;
  /** The Hero Timepiece in this Colourway, from the front. */
  still: Still;
};

/** A fixed image of a Timepiece, served from `public`. */
export type Still = {
  src: string;
  alt: string;
  view: StillView;
};

/**
 * How the Timepiece is held in a Still: arrived and facing the Shopper, in
 * profile as the turn act leaves it, or open in the Exploded View.
 */
export type StillView = "front" | "profile" | "exploded";

export async function listCollections(): Promise<Collection[]> {
  return collections;
}

/** The Collection at this slug, if Tolvik has one. */
export async function getCollection(
  slug: string,
): Promise<Collection | undefined> {
  return collections.find((collection) => collection.slug === slug);
}

export async function listTimepieces(): Promise<Timepiece[]> {
  return timepieces;
}

/** The Timepiece at this slug, if Tolvik makes one. */
export async function getTimepiece(
  slug: string,
): Promise<Timepiece | undefined> {
  return timepieces.find((timepiece) => timepiece.slug === slug);
}

/** The one Timepiece shown in real-time 3D. */
export async function getHeroTimepiece(): Promise<Timepiece> {
  const hero = timepieces.find((timepiece) => timepiece.isHero);
  if (!hero) throw new Error("The Catalogue has no Hero Timepiece");
  return hero;
}

/** The Colourways the Hero Timepiece comes in. No other Timepiece has any. */
export async function listColourways(): Promise<Colourway[]> {
  return colourways;
}

/**
 * The Colourway a Shopper is shown before they choose: the Hero Timepiece
 * as it is listed.
 */
export async function getDefaultColourway(): Promise<Colourway> {
  return defaultColourway;
}
