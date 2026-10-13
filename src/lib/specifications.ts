import type { Specifications } from "@/lib/catalogue";

// How a Timepiece's page sets out its specifications: three short groups a
// Shopper can scan, in place of one list of seven. Every specification is
// named in exactly one of them.
const GROUPS = [
  {
    name: "The case",
    specifications: [
      ["case", "Case"],
      ["crystal", "Crystal"],
      ["waterResistance", "Water resistance"],
    ],
  },
  {
    name: "The movement",
    specifications: [
      ["movement", "Movement"],
      ["powerReserve", "Power reserve"],
    ],
  },
  {
    name: "The dial and bracelet",
    specifications: [
      ["dial", "Dial"],
      ["bracelet", "Bracelet"],
    ],
  },
] as const satisfies {
  name: string;
  specifications: (readonly [keyof Specifications, string])[];
}[];

export type SpecificationGroup = {
  name: string;
  entries: { label: string; value: string }[];
};

/** A Timepiece's specifications in the groups its page shows them in. */
export function groupSpecifications(
  specifications: Specifications,
): SpecificationGroup[] {
  return GROUPS.map((group) => ({
    name: group.name,
    entries: group.specifications.map(([specification, label]) => ({
      label,
      value: specifications[specification],
    })),
  }));
}
