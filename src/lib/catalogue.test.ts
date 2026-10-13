import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

import {
  getCollection,
  getDefaultColourway,
  getHeroTimepiece,
  getTimepiece,
  listCollections,
  listColourways,
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

test("every Timepiece's Collection is found by its slug", async () => {
  const collections = await listCollections();

  for (const { name, collection } of await listTimepieces()) {
    expect(collections, name).toContain(await getCollection(collection));
  }
  expect(await getCollection("a-collection-tolvik-never-made")).toBeUndefined();
});

test("the six Timepieces come in six Finishes", async () => {
  const finishes = (await listTimepieces()).map(({ finish }) =>
    [finish.dial, finish.case, finish.bracelet].join(" "),
  );

  expect(new Set(finishes).size).toBe(6);
});

test("the Hero Timepiece comes in six Colourways: three dial colours, each on two bracelets", async () => {
  const colourways = await listColourways();

  expect(colourways).toHaveLength(6);
  expect(new Set(colourways.map(({ dial }) => dial)).size).toBe(3);
  expect(new Set(colourways.map(({ bracelet }) => bracelet))).toEqual(
    new Set(["Brushed steel", "Blackened steel"]),
  );
  // No two are the same choice, and each has a slug and a name of its own.
  for (const key of ["slug", "name"] as const) {
    expect(new Set(colourways.map((colourway) => colourway[key])).size).toBe(6);
  }
  expect(
    new Set(colourways.map(({ dial, bracelet }) => `${dial} on ${bracelet}`))
      .size,
  ).toBe(6);
});

test("the default Colourway is the Hero Timepiece as it is listed", async () => {
  const hero = await getHeroTimepiece();
  const chosen = await getDefaultColourway();

  expect(await listColourways()).toContain(chosen);
  expect(chosen.finish).toEqual(hero.finish);
});

// This one reads the committed files that `npm run stills` writes, so a new
// Timepiece without its photograph fails here.
test("every Timepiece has three Stills, and every Still is a committed file", async () => {
  const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

  for (const { name, stills } of await listTimepieces()) {
    // From the front first: that is the one a listing shows.
    expect(
      stills.map(({ view }) => view),
      name,
    ).toEqual(["front", "profile", "exploded"]);
    for (const { src, alt } of stills) {
      expect(existsSync(publicDir + src), src).toBe(true);
      expect(alt, src).toContain(name);
    }
  }
});

test("every Colourway has a Still of its own from the front, a committed file", async () => {
  const publicDir = fileURLToPath(new URL("../../public", import.meta.url));
  const hero = await getHeroTimepiece();
  const colourways = await listColourways();

  expect(new Set(colourways.map(({ still }) => still.src)).size).toBe(6);
  for (const { name, still } of colourways) {
    expect(still.view, name).toBe("front");
    expect(existsSync(publicDir + still.src), still.src).toBe(true);
    expect(still.alt, name).toContain(hero.name);
  }
  // The default Colourway is the Hero Timepiece as a listing shows it.
  expect((await getDefaultColourway()).still).toEqual(hero.stills[0]);
});
