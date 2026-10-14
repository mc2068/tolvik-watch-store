"use client";

import { useCart } from "@/store/cart";
import type { WhichLine } from "@/store/cart-lines";

/**
 * The one thing a Timepiece's page asks of the Shopper, so it is the one
 * solid button on the site: it puts the Timepiece in the cart, which slides
 * out to show it there.
 */
export function AddToCart({
  timepiece,
  colourway,
  className = "",
}: WhichLine & { className?: string }) {
  const add = useCart((cart) => cart.add);

  return (
    <button
      type="button"
      onClick={() => add({ timepiece, colourway })}
      className={`inline-flex h-12 items-center justify-center bg-platinum px-7 text-small tracking-open whitespace-nowrap text-ink transition-colors duration-(--duration-quick) ease-settle hover:bg-steel max-md:w-full ${className}`}
    >
      Add to cart
    </button>
  );
}
