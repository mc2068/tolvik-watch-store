import { expect, test } from "vitest";

import { listColourways, listTimepieces } from "@/lib/catalogue";
import {
  addLine,
  keptLines,
  priceCart,
  removeLine,
  setLineQuantity,
} from "@/store/cart-lines";

// The Hero Timepiece in two of its Colourways.
const blue = { timepiece: "tjern", colourway: "deep-blue-brushed-steel" };
const red = { timepiece: "tjern", colourway: "rowan-red-brushed-steel" };

const catalogue = async () => ({
  timepieces: await listTimepieces(),
  colourways: await listColourways(),
});

test("adding a Timepiece makes a line of one, and adding it again makes it two", () => {
  const once = addLine([], { timepiece: "skifer" });
  const twice = addLine(once, { timepiece: "skifer" });

  expect(once).toEqual([{ timepiece: "skifer", quantity: 1 }]);
  expect(twice).toEqual([{ timepiece: "skifer", quantity: 2 }]);
});

test("the Hero Timepiece in two Colourways is two lines", () => {
  const lines = [blue, red, red].reduce(addLine, []);

  expect(lines).toEqual([
    { ...blue, quantity: 1 },
    { ...red, quantity: 2 },
  ]);
});

test("a line's quantity is set to a whole number from one to nine", () => {
  const lines = [
    { timepiece: "skifer", quantity: 1 },
    { timepiece: "kull", quantity: 1 },
  ];
  const quantities = (quantity: number) =>
    setLineQuantity(lines, { timepiece: "kull" }, quantity).map(
      (line) => line.quantity,
    );

  expect(quantities(4)).toEqual([1, 4]);
  // Never none, which is what removing a line is for, and never a crate.
  expect(quantities(0)).toEqual([1, 1]);
  expect(quantities(12)).toEqual([1, 9]);
  expect(quantities(2.6)).toEqual([1, 2]);
});

test("adding to a line that holds nine leaves it at nine", () => {
  const lines = [{ timepiece: "skifer", quantity: 9 }];

  expect(addLine(lines, { timepiece: "skifer" })).toEqual(lines);
});

test("removing a line leaves the others as they were", () => {
  const lines = [
    { ...blue, quantity: 2 },
    { ...red, quantity: 1 },
    { timepiece: "kull", quantity: 3 },
  ];

  expect(removeLine(lines, red)).toEqual([
    { ...blue, quantity: 2 },
    { timepiece: "kull", quantity: 3 },
  ]);
});

test("a cart is priced from the Catalogue: each line's name and price, the count and the total", async () => {
  const cart = priceCart(
    [
      { ...red, quantity: 2 },
      { timepiece: "kull", quantity: 1 },
    ],
    await catalogue(),
  );

  expect(
    cart.lines.map(({ timepiece, colourway, quantity, price }) => [
      timepiece.name,
      colourway?.name,
      quantity,
      price,
    ]),
  ).toEqual([
    ["Tjern", "Rowan red dial, brushed steel bracelet", 2, 12800],
    ["Kull", undefined, 1, 7600],
  ]);
  // Each priced line still says which line of the cart it is.
  expect(cart.lines.map(({ which }) => which)).toEqual([
    red,
    { timepiece: "kull" },
  ]);
  expect(cart.count).toBe(3);
  expect(cart.total).toBe(20400);
});

test("a line the Catalogue cannot make sense of is left out of the cart", async () => {
  const cart = priceCart(
    [
      { timepiece: "a-watch-tolvik-never-made", quantity: 1 },
      { timepiece: "tjern", colourway: "a-colourway-never-made", quantity: 1 },
      // Only the Hero Timepiece has Colourways.
      { timepiece: "kull", colourway: blue.colourway, quantity: 1 },
      { timepiece: "skifer", quantity: 2 },
    ],
    await catalogue(),
  );

  expect(cart.lines.map(({ timepiece }) => timepiece.name)).toEqual(["Skifer"]);
  expect(cart.count).toBe(2);
  expect(cart.total).toBe(11600);
});

test("an empty cart counts nothing and comes to nothing", () => {
  expect(priceCart([], { timepieces: [], colourways: [] })).toEqual({
    lines: [],
    count: 0,
    total: 0,
  });
});

test("what the browser kept of the cart is taken back line by line, and only the well-formed ones", () => {
  const sound = [
    { timepiece: "skifer", quantity: 2 },
    { ...red, quantity: 9 },
  ];

  expect(
    keptLines({
      lines: [
        ...sound,
        null,
        "kull",
        { quantity: 1 },
        { timepiece: 7, quantity: 1 },
        { timepiece: "kull", colourway: 7, quantity: 1 },
        { timepiece: "kull", quantity: "3" },
        { timepiece: "kull", quantity: 0 },
        { timepiece: "kull", quantity: 1.5 },
        { timepiece: "kull", quantity: 10 },
      ],
    }),
  ).toEqual(sound);
});

test("a kept cart that is not a cart at all comes back empty", () => {
  for (const kept of [undefined, null, "a cart", 3, {}, { lines: null }]) {
    expect(keptLines(kept), JSON.stringify(kept)).toEqual([]);
  }
});

test("a kept line brings back nothing but its Timepiece, its Colourway and its quantity", () => {
  const kept = { lines: [{ ...blue, quantity: 1, name: "Tjern", price: 1 }] };

  expect(keptLines(kept)).toEqual([{ ...blue, quantity: 1 }]);
});
