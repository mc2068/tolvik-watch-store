import { expect, test } from "vitest";

import { groupSpecifications } from "@/lib/specifications";

const specifications = {
  case: "40 mm brushed steel, 11 mm deep",
  movement: "Automatic, calibre T12, 28,800 beats an hour",
  powerReserve: "60 hours",
  waterResistance: "100 metres",
  crystal: "Domed sapphire, anti-reflective on the inside",
  bracelet: "Brushed steel links with a folding clasp",
  dial: "Slate grey, with luminous batons and hands",
};

test("the seven specifications are set out in three named groups", () => {
  expect(groupSpecifications(specifications)).toEqual([
    {
      name: "The case",
      entries: [
        { label: "Case", value: "40 mm brushed steel, 11 mm deep" },
        {
          label: "Crystal",
          value: "Domed sapphire, anti-reflective on the inside",
        },
        { label: "Water resistance", value: "100 metres" },
      ],
    },
    {
      name: "The movement",
      entries: [
        {
          label: "Movement",
          value: "Automatic, calibre T12, 28,800 beats an hour",
        },
        { label: "Power reserve", value: "60 hours" },
      ],
    },
    {
      name: "The dial and bracelet",
      entries: [
        { label: "Dial", value: "Slate grey, with luminous batons and hands" },
        { label: "Bracelet", value: "Brushed steel links with a folding clasp" },
      ],
    },
  ]);
});
