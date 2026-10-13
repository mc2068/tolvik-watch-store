import type { Collection } from "../lib/catalogue.ts";

// Tolvik's two Collections. Sample data: the brand and everything said of
// it are invented. Only the Catalogue reads this file.
export const collections: Collection[] = [
  {
    slug: "kyst",
    name: "Kyst",
    description:
      "Brushed steel on a steel bracelet, in the colours of the northern coast.",
  },
  {
    slug: "natt",
    name: "Natt",
    description:
      "The same watch in blackened steel, made for the long winter night.",
  },
];
