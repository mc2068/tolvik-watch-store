// PROTOTYPE, throwaway. Lives on the `prototype/exploded-view-look` branch
// only and must never reach main.
//
// The question: what should the Exploded View look like? Three variants of
// it on Home, switchable via `?variant=`, on the existing `/` route.
//
// Like the act progress, this is a plain object outside React, so the 3D
// scene can read the variant on every frame and switching needs no reload:
// the page stays where it is scrolled and only the look changes.

export const VARIANTS = {
  A: "Upright stack, names in a column",
  B: "Side-on row, names above and below",
  C: "Names as an index, one part called out",
} as const;

export type Variant = keyof typeof VARIANTS;

export const VARIANT_KEYS = Object.keys(VARIANTS) as Variant[];

let chosen: Variant | undefined;
let wide: MediaQueryList | undefined;
// The part the index calls out, by its place in PARTS, or -1 for none.
let focus = -1;
const listeners = new Set<() => void>();

const tell = () => {
  for (const listener of listeners) listener();
};

function read(): Variant {
  if (chosen === undefined) {
    const asked = new URLSearchParams(window.location.search)
      .get("variant")
      ?.toUpperCase();
    chosen = VARIANT_KEYS.find((key) => key === asked) ?? "A";
    wide = window.matchMedia("(min-width: 64rem)");
    wide.addEventListener("change", tell);
  }
  return chosen;
}

export const prototypeVariant = {
  /** The variant the address asks for. */
  chosen(): Variant {
    return read();
  },

  /**
   * The variant in effect. B lays the watch out in a row, which a narrow
   * screen has no room for, so there it falls back to A.
   */
  get(): Variant {
    const variant = read();
    return variant === "B" && !wide?.matches ? "A" : variant;
  },

  choose(next: Variant): void {
    chosen = next;
    const address = new URL(window.location.href);
    address.searchParams.set("variant", next);
    window.history.replaceState(null, "", address);
    tell();
  },

  focus(): number {
    return focus;
  },

  setFocus(next: number): void {
    if (focus === next) return;
    focus = next;
    tell();
  },

  onChange(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
