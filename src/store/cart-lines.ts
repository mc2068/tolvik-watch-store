// What the cart holds and the sums done on it, apart from where it is kept:
// pure functions over a list of lines, each returning a new list. The store
// in `cart.ts` keeps the list in the Shopper's browser and calls these.

import type { Colourway, Timepiece } from "@/lib/catalogue";

/**
 * One line of the cart: a Timepiece, the Colourway it was chosen in where
 * it has any, and how many. It names both by slug and copies nothing else,
 * so a name or a price is always the Catalogue's own.
 */
export type CartLine = {
  timepiece: string;
  colourway?: string;
  quantity: number;
};

/** Which line of the cart: a Timepiece, in a Colourway where it has any. */
export type WhichLine = Pick<CartLine, "timepiece" | "colourway">;

const isLine = (which: WhichLine) => (line: CartLine) =>
  line.timepiece === which.timepiece && line.colourway === which.colourway;

/** A name for a line that no other line of the same cart shares. */
export function lineKey({ timepiece, colourway }: WhichLine): string {
  return colourway ? `${timepiece} in ${colourway}` : timepiece;
}

/** The most of one Timepiece a line can hold. */
export const MOST_OF_ONE = 9;

/**
 * The lines with one more of this Timepiece: on its own line if it has one,
 * which never holds more than `MOST_OF_ONE`, and on a new line if not.
 */
export function addLine(lines: CartLine[], which: WhichLine): CartLine[] {
  const line = lines.find(isLine(which));
  if (!line) return [...lines, { ...which, quantity: 1 }];

  return setLineQuantity(lines, which, line.quantity + 1);
}

/** The lines without this one. */
export function removeLine(lines: CartLine[], which: WhichLine): CartLine[] {
  return lines.filter((line) => !isLine(which)(line));
}

/**
 * The lines with this one's quantity set: to a whole number, at least one
 * and at most `MOST_OF_ONE`. Taking the last one away is `removeLine`.
 */
export function setLineQuantity(
  lines: CartLine[],
  which: WhichLine,
  quantity: number,
): CartLine[] {
  const settled = Math.min(Math.max(Math.floor(quantity), 1), MOST_OF_ONE);

  return lines.map((line) =>
    isLine(which)(line) ? { ...line, quantity: settled } : line,
  );
}

/**
 * The lines in what the browser kept of the cart between visits. What comes
 * back from storage is whatever was left there, by this site as it is now,
 * by an older one or by hand, so each line is checked, and one that is not
 * a line is dropped. Whatever else a line was kept with stays behind.
 */
export function keptLines(kept: unknown): CartLine[] {
  const lines = (kept as { lines?: unknown } | null)?.lines;
  if (!Array.isArray(lines)) return [];

  return lines.flatMap((line: Partial<Record<keyof CartLine, unknown>>) => {
    const { timepiece, colourway, quantity } = line ?? {};
    const isALine =
      typeof timepiece === "string" &&
      (colourway === undefined || typeof colourway === "string") &&
      Number.isInteger(quantity) &&
      (quantity as number) >= 1 &&
      (quantity as number) <= MOST_OF_ONE;

    return isALine ? [{ timepiece, colourway, quantity } as CartLine] : [];
  });
}

/** What the cart needs of the Catalogue to show and price its lines. */
export type CartCatalogue = {
  timepieces: Timepiece[];
  colourways: Colourway[];
};

/** A line as the cart shows it: its Timepiece and Colourway looked up. */
export type PricedLine = {
  /** Which line of the cart this is, to change or remove it by. */
  which: WhichLine;
  timepiece: Timepiece;
  colourway?: Colourway;
  quantity: number;
  /** What the line comes to, in whole US dollars. */
  price: number;
};

export type PricedCart = {
  lines: PricedLine[];
  /** How many Timepieces there are in it, over all its lines. */
  count: number;
  /** What it comes to, in whole US dollars. */
  total: number;
};

/**
 * The cart as the Catalogue prices it today. A line the Catalogue cannot
 * make sense of is left out, and out of the count and the total with it: a
 * Timepiece or a Colourway it no longer has, since a cart is kept between
 * visits and what Tolvik offers may have changed, or a Colourway on a
 * Timepiece other than the Hero, which has none.
 */
export function priceCart(
  lines: CartLine[],
  { timepieces, colourways }: CartCatalogue,
): PricedCart {
  const priced = lines.flatMap((line): PricedLine[] => {
    const timepiece = timepieces.find(({ slug }) => slug === line.timepiece);
    if (!timepiece) return [];

    const colourway = colourways.find(({ slug }) => slug === line.colourway);
    if (line.colourway && !(timepiece.isHero && colourway)) return [];

    const { quantity } = line;
    const which = { timepiece: line.timepiece, colourway: line.colourway };
    const price = timepiece.price * quantity;
    return [{ which, timepiece, colourway, quantity, price }];
  });

  return {
    lines: priced,
    count: priced.reduce((count, { quantity }) => count + quantity, 0),
    total: priced.reduce((total, { price }) => total + price, 0),
  };
}
