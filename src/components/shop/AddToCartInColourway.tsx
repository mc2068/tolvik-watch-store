"use client";

import { AddToCart } from "@/components/shop/AddToCart";
import { useColourwayChoice } from "@/components/shop/ColourwayChoice";

/**
 * "Add to cart" on the Hero Timepiece's page: it adds the watch in the
 * Colourway the Shopper has chosen, the one they are looking at.
 */
export function AddToCartInColourway({
  timepiece,
  className,
}: {
  /** The Hero Timepiece's slug. */
  timepiece: string;
  className?: string;
}) {
  const { chosen } = useColourwayChoice();

  return (
    <AddToCart
      timepiece={timepiece}
      colourway={chosen.slug}
      className={className}
    />
  );
}
