import type { Colourway, Steel } from "../lib/catalogue.ts";
import { timepieces } from "./timepieces.ts";

// The Colourways the Hero Timepiece comes in: each of three dial colours on
// each of two bracelets. Sample data, invented like the rest. Only the
// Catalogue reads this file.
//
// The case is the Hero Timepiece's own in every one. The first dial on the
// first bracelet is the Hero Timepiece as `timepieces.ts` has it, and the
// Colourway a Shopper is shown before they choose.

const hero = timepieces.find((timepiece) => timepiece.isHero)!;
const [heroStill] = hero.stills;

const dials = [
  { slug: "deep-blue", name: "Deep blue", colour: hero.finish.dial },
  { slug: "glacier-blue", name: "Glacier blue", colour: "#6f93b3" },
  { slug: "rowan-red", name: "Rowan red", colour: "#8f2f22" },
];

const bracelets: { slug: string; name: string; steel: Steel }[] = [
  { slug: "brushed-steel", name: "Brushed steel", steel: "bare" },
  { slug: "blackened-steel", name: "Blackened steel", steel: "blackened" },
];

function colourwayOf(
  dial: (typeof dials)[number],
  bracelet: (typeof bracelets)[number],
): Colourway {
  const slug = `${dial.slug}-${bracelet.slug}`;
  const [dialName, braceletName] = [dial.name, bracelet.name].map((name) =>
    name.toLowerCase(),
  );

  return {
    slug,
    name: `${dial.name} dial, ${braceletName} bracelet`,
    dial: dial.name,
    bracelet: bracelet.name,
    finish: {
      dial: dial.colour,
      case: hero.finish.case,
      bracelet: bracelet.steel,
    },
    // `npm run stills` files each beside the Hero Timepiece's own Still.
    still: {
      view: "front",
      src: heroStill.src.replace(".webp", `-${slug}.webp`),
      alt: `The ${hero.name} with a ${dialName} dial and a ${braceletName} bracelet`,
    },
  };
}

// The Hero Timepiece as it is listed, so its Still is that Timepiece's own.
export const defaultColourway: Colourway = {
  ...colourwayOf(dials[0], bracelets[0]),
  still: heroStill,
};

export const colourways: Colourway[] = dials.flatMap((dial) =>
  bracelets.map((bracelet) =>
    dial === dials[0] && bracelet === bracelets[0]
      ? defaultColourway
      : colourwayOf(dial, bracelet),
  ),
);
