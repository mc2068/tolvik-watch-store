import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

import {
  getHeroTimepiece,
  getTimepiece,
  listCollections,
  listTimepieces,
} from "@/lib/catalogue";

test("the Catalogue offers six Timepieces in two Collections", async () => {
  const collections = await listCollections();
  const timepieces = await listTimepieces();

  expect(collections).toHaveLength(2);
  expect(timepieces).toHaveLength(6);
  // Every Timepiece is in one of the two, and neither Collection is empty.
  expect(new Set(timepieces.map((timepiece) => timepiece.collection))).toEqual(
    new Set(collections.map((collection) => collection.slug)),
  );
});

test("exactly one Timepiece is the Hero Timepiece", async () => {
  const heroes = (await listTimepieces()).filter(
    (timepiece) => timepiece.isHero,
  );

  expect(heroes).toHaveLength(1);
  expect(await getHeroTimepiece()).toBe(heroes[0]);
});

test("every price is in whole US dollars, between $4,000 and $15,000", async () => {
  for (const { name, price } of await listTimepieces()) {
    expect(Number.isInteger(price), name).toBe(true);
    expect(price, name).toBeGreaterThanOrEqual(4000);
    expect(price, name).toBeLessThanOrEqual(15000);
  }
});

test("a Timepiece is found by its slug, and an unknown slug finds nothing", async () => {
  const timepieces = await listTimepieces();

  for (const timepiece of timepieces) {
    expect(await getTimepiece(timepiece.slug)).toBe(timepiece);
  }
  expect(await getTimepiece("a-watch-tolvik-never-made")).toBeUndefined();
});

test("the six Timepieces come in six Finishes", async () => {
  const finishes = (await listTimepieces()).map(({ finish }) =>
    [finish.dial, finish.case, finish.bracelet].join(" "),
  );

  expect(new Set(finishes).size).toBe(6);
});

// This one reads the committed files that `npm run stills` writes, so a new
// Timepiece without its photograph fails here.
test("every Timepiece has a Still, and every Still is a committed file", async () => {
  const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

  for (const { name, stills } of await listTimepieces()) {
    expect(stills.length, name).toBeGreaterThan(0);
    for (const { src, alt } of stills) {
      expect(existsSync(publicDir + src), src).toBe(true);
      expect(alt, src).toContain(name);
    }
  }
});
