import type { Specifications, Timepiece } from "../lib/catalogue.ts";

// Tolvik's six Timepieces. Sample data: every name, price and specification
// is invented. Only the Catalogue reads this file.
//
// All six share one case shape, so what tells them apart is the Finish. Each
// Still is photographed from the 3D model in that Finish by `npm run stills`.

// What every Timepiece has in common, whatever its Finish.
const shared = {
  movement: "Automatic, calibre T12, 28,800 beats an hour",
  powerReserve: "60 hours",
  waterResistance: "100 metres",
  crystal: "Domed sapphire, anti-reflective on the inside",
} satisfies Partial<Specifications>;

const inSteel = {
  ...shared,
  case: "40 mm brushed steel, 11 mm deep",
  bracelet: "Brushed steel links with a folding clasp",
} satisfies Partial<Specifications>;

const inBlackenedSteel = {
  ...shared,
  case: "40 mm blackened steel, 11 mm deep",
  bracelet: "Blackened steel links with a folding clasp",
} satisfies Partial<Specifications>;

export const timepieces: Timepiece[] = [
  {
    slug: "tjern",
    name: "Tjern",
    collection: "kyst",
    price: 6400,
    description:
      "Named for the dark mountain lakes of the north. Brushed steel with a deep blue dial.",
    specifications: {
      ...inSteel,
      dial: "Deep blue, with luminous batons and hands",
    },
    finish: { dial: "#1b3352", case: "bare", bracelet: "bare" },
    // Home shows this Still too, wherever the 3D never comes.
    stills: [
      {
        src: "/stills/hero-timepiece.webp",
        alt: "The Tjern in brushed steel, with a deep blue dial",
      },
    ],
    isHero: true,
  },
  {
    slug: "skifer",
    name: "Skifer",
    collection: "kyst",
    price: 5800,
    description:
      "The quietest Tolvik. Brushed steel with a dial the grey of split slate.",
    specifications: {
      ...inSteel,
      dial: "Slate grey, with luminous batons and hands",
    },
    finish: { dial: "#5b636e", case: "bare", bracelet: "bare" },
    stills: [
      {
        src: "/stills/skifer.webp",
        alt: "The Skifer in brushed steel, with a slate grey dial",
      },
    ],
    isHero: false,
  },
  {
    slug: "gran",
    name: "Gran",
    collection: "kyst",
    price: 6900,
    description:
      "Brushed steel with a lacquered dial in the green of a spruce forest at dusk.",
    specifications: {
      ...inSteel,
      dial: "Spruce green lacquer, with luminous batons and hands",
    },
    finish: { dial: "#245c44", case: "bare", bracelet: "bare" },
    stills: [
      {
        src: "/stills/gran.webp",
        alt: "The Gran in brushed steel, with a spruce green dial",
      },
    ],
    isHero: false,
  },
  {
    slug: "kull",
    name: "Kull",
    collection: "natt",
    price: 7600,
    description:
      "Black on black. Blackened steel with a coal dial, so that only the hands and batons show.",
    specifications: {
      ...inBlackenedSteel,
      dial: "Coal black, with luminous batons and hands",
    },
    finish: { dial: "#101214", case: "blackened", bracelet: "blackened" },
    stills: [
      {
        src: "/stills/kull.webp",
        alt: "The Kull in blackened steel, with a coal black dial",
      },
    ],
    isHero: false,
  },
  {
    slug: "midnatt",
    name: "Midnatt",
    collection: "natt",
    price: 8200,
    description:
      "Blackened steel with a dial the blue of the sky an hour after sunset.",
    specifications: {
      ...inBlackenedSteel,
      dial: "Midnight blue, with luminous batons and hands",
    },
    finish: { dial: "#17275c", case: "blackened", bracelet: "blackened" },
    stills: [
      {
        src: "/stills/midnatt.webp",
        alt: "The Midnatt in blackened steel, with a midnight blue dial",
      },
    ],
    isHero: false,
  },
  {
    slug: "lyng",
    name: "Lyng",
    collection: "natt",
    price: 8900,
    description:
      "Blackened steel with a lacquered dial in the muted plum of late heather.",
    specifications: {
      ...inBlackenedSteel,
      dial: "Heather plum lacquer, with luminous batons and hands",
    },
    finish: { dial: "#52305a", case: "blackened", bracelet: "blackened" },
    stills: [
      {
        src: "/stills/lyng.webp",
        alt: "The Lyng in blackened steel, with a heather plum dial",
      },
    ],
    isHero: false,
  },
];
