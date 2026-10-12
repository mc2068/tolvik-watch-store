import {
  AdditiveBlending,
  DoubleSide,
  type Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from "three";

import type { Part } from "@/components/three/hero-model";

// The prepared model carries no materials, so each part is finished here.
// These are the colours of physical surfaces under studio light, not
// interface colours, which is why they are not tokens in globals.css.
const STEEL = "#c4c8cd";
const DIAL_BLUE = "#1b3352";
// The hands and markers are filled with a pale luminous paint, so they are
// the first thing to show in the dark and the last to fade.
const LUME = "#dfe9f2";
const LUME_GLOW = 0.3;

/** One material per part. The caller owns them and disposes of them. */
export function createFinish(): Record<Part, Material> {
  const brushedSteel = { color: STEEL, metalness: 1, roughness: 0.34 };
  const polishedSteel = { color: STEEL, metalness: 1, roughness: 0.16 };
  const lumed = {
    color: LUME,
    metalness: 0.3,
    roughness: 0.4,
    emissive: LUME,
    emissiveIntensity: LUME_GLOW,
  };

  return {
    // Sapphire, drawn as its reflections alone: a black surface added on top
    // of what is behind it leaves the dial untouched and lays the highlights
    // over it. Far cheaper than true refraction, which a phone cannot afford.
    // A little roughness softens the studio's panels into a sheen; a perfect
    // mirror would draw their hard edges across the dial.
    crystal: new MeshPhysicalMaterial({
      color: "#000000",
      roughness: 0.25,
      metalness: 0,
      ior: 1.77,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    hands: new MeshStandardMaterial(lumed),
    dial: new MeshStandardMaterial(lumed),
    "dial-base": new MeshStandardMaterial({
      color: DIAL_BLUE,
      metalness: 0.35,
      roughness: 0.55,
    }),
    case: new MeshStandardMaterial(brushedSteel),
    "crown-and-pushers": new MeshStandardMaterial(polishedSteel),
    // The links are open shells, so both faces are drawn.
    bracelet: new MeshStandardMaterial({ ...brushedSteel, side: DoubleSide }),
  };
}
