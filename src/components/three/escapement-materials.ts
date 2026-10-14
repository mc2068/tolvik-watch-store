import {
  DoubleSide,
  type Material,
  MeshStandardMaterial,
  type MeshStandardMaterialParameters,
} from "three";

import type { EscapementPiece } from "@/components/three/escapement-model";

// The prepared escapement carries no materials, so each piece is given one
// here. Like the Hero Timepiece's, these are the colours of physical
// surfaces under studio light, not interface colours, so they are not
// tokens. Some of the model's surfaces are open, so both faces are drawn.

// Tolvik's steel, as the Hero Timepiece's case has it, polished on the
// pieces that turn and left brushed on the bearings that hold them.
const STEEL = "#c4c8cd";
const steel = (roughness: number) => ({
  color: STEEL,
  metalness: 1,
  roughness,
});

/**
 * One material per piece. The caller owns them and disposes of them.
 */
export function createEscapementMaterials(): Record<EscapementPiece, Material> {
  const make = (surface: MeshStandardMaterialParameters) =>
    new MeshStandardMaterial({ ...surface, side: DoubleSide });
  const polished = steel(0.18);
  // Synthetic rubies: the pallet stones and the impulse pin take the
  // wear where steel meets steel. A dark red, far from the page's accent.
  const ruby = { color: "#6b1a26", metalness: 0, roughness: 0.15 };

  return {
    "balance-wheel": make(polished),
    // A hairspring is blued by heat, the one coloured steel in a watch:
    // a physical colour, like the rest, though near Tolvik's accent.
    hairspring: make({ color: "#41618a", metalness: 1, roughness: 0.28 }),
    "balance-staff": make(polished),
    "impulse-pin": make(ruby),
    "pallet-fork": make(polished),
    "pallet-stones": make(ruby),
    "escape-wheel": make(polished),
    "banking-pins": make(polished),
    bearings: make({ ...steel(0.38), color: "#8e949c" }),
  };
}
