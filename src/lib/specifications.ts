import type { Specifications } from "@/lib/catalogue";

// How a Timepiece's page sets out its specifications: three short groups a
// Shopper can scan, in place of one list of seven.
const GROUPS = ["The case", "The movement", "The dial and bracelet"] as const;

// Which group each specification is shown in and what it is called there,
// in the order a group lists them. It is a record of every specification,
// so one added to the Catalogue will not compile until it has a place here.
const SHOWN: Record<
  keyof Specifications,
  { group: (typeof GROUPS)[number]; label: string }
> = {
  case: { group: "The case", label: "Case" },
  crystal: { group: "The case", label: "Crystal" },
  waterResistance: { group: "The case", label: "Water resistance" },
  movement: { group: "The movement", label: "Movement" },
  powerReserve: { group: "The movement", label: "Power reserve" },
  dial: { group: "The dial and bracelet", label: "Dial" },
  bracelet: { group: "The dial and bracelet", label: "Bracelet" },
};

export type SpecificationGroup = {
  name: string;
  entries: { label: string; value: string }[];
};

/** A Timepiece's specifications in the groups its page shows them in. */
export function groupSpecifications(
  specifications: Specifications,
): SpecificationGroup[] {
  const shown = Object.entries(SHOWN) as [
    keyof Specifications,
    (typeof SHOWN)[keyof Specifications],
  ][];

  return GROUPS.map((name) => ({
    name,
    entries: shown
      .filter(([, { group }]) => group === name)
      .map(([specification, { label }]) => ({
        label,
        value: specifications[specification],
      })),
  }));
}
