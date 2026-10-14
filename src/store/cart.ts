import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  addLine,
  type CartLine,
  keptLines,
  removeLine,
  setLineQuantity,
  type WhichLine,
} from "@/store/cart-lines";

type Cart = {
  lines: CartLine[];
  /** Whether the cart is slid out over the page. */
  isOpen: boolean;
  /** Puts one more of a Timepiece in the cart, and slides it out to show. */
  add: (which: WhichLine) => void;
  setQuantity: (which: WhichLine, quantity: number) => void;
  remove: (which: WhichLine) => void;
  /** Empties the cart, as confirming an order does. */
  clear: () => void;
  open: () => void;
  close: () => void;
};

// A store is state that lives outside any one component, here made with
// Zustand: `useCart` hands a component the part of it that component asks
// for, and renders it again when that part changes. The header's count, the
// cart itself and a page's "Add to cart" button are far apart on the page
// and all share this one.
//
// `persist` keeps the store in the Shopper's browser (`localStorage`), so
// the cart is still there after a reload. It keeps the lines alone:
// `partialize` leaves out whether the cart is open, which every visit
// starts closed, and `merge` takes back only what are still lines, so that
// nothing left in storage can break the page. The server has no such
// storage and renders the cart empty; Zustand has the browser start from the
// same empty cart and bring in the stored one straight after, so the two
// never disagree.
export const useCart = create<Cart>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      add: (which) =>
        set(({ lines }) => ({ lines: addLine(lines, which), isOpen: true })),
      setQuantity: (which, quantity) =>
        set(({ lines }) => ({
          lines: setLineQuantity(lines, which, quantity),
        })),
      remove: (which) =>
        set(({ lines }) => ({ lines: removeLine(lines, which) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "tolvik-cart",
      partialize: ({ lines }) => ({ lines }),
      merge: (kept, cart) => ({ ...cart, lines: keptLines(kept) }),
    },
  ),
);

const onRestored = (restored: () => void) =>
  useCart.persist.onFinishHydration(restored);
const isRestored = () => useCart.persist.hasHydrated();
const notYetRestored = () => false;

/**
 * Whether the cart has been brought back from the Shopper's browser. Until
 * it has, the cart reads empty, as the server rendered it, so a page that
 * acts on an empty cart waits for this first: an empty cart it saw before
 * then may not be empty at all.
 */
export function useCartRestored(): boolean {
  // The server has no stored cart to bring back, so on the server, and in
  // the browser's first render that must match it, the answer is no.
  return useSyncExternalStore(onRestored, isRestored, notYetRestored);
}
