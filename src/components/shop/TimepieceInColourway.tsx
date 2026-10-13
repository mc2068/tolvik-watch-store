"use client";

import { useColourwayChoice } from "@/components/shop/ColourwayChoice";
import { LiveTimepiece } from "@/components/shop/LiveTimepiece";

/**
 * The Hero Timepiece on its own page, in the Colourway the Shopper has
 * chosen: live, arrived and lit, to be dragged and looked around. It fills
 * the frame it is put in.
 */
export function TimepieceInColourway() {
  const { chosen } = useColourwayChoice();

  return (
    <LiveTimepiece
      finish={chosen.finish}
      still={chosen.still}
      arrived
      statusClassName="bottom-4"
    />
  );
}
