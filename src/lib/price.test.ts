import { expect, test } from "vitest";

import { formatPrice } from "@/lib/price";

test("a price is shown in whole US dollars, with its thousands grouped", () => {
  expect(formatPrice(6400)).toBe("$6,400");
  expect(formatPrice(14950)).toBe("$14,950");
});
