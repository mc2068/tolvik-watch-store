import { expect, test } from "vitest";

import { site } from "@/lib/site";

// Harness check: proves the runner compiles TypeScript and resolves the
// app's `@/` alias. The clock and Exploded View layout tests replace it as
// the suite's real content.
test("the site is named Tolvik", () => {
  expect(site.name).toBe("Tolvik");
});
