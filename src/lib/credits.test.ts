import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { creditLine, modelCredits } from "@/lib/credits";

// The README is shared wherever the code is, so it carries each model's
// credit too, in the licence's own words.
test.each(modelCredits)("the README credits $title", (credit) => {
  const readme = readFileSync("README.md", "utf8");

  expect(readme).toContain(creditLine(credit));
});
