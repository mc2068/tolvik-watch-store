import {
  AdditiveBlending,
  DoubleSide,
  type Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from "three";

import type { Part } from "@/components/three/hero-model";
import type { Finish, Steel } from "@/lib/catalogue";

// The prepared model carries no materials, so each part is given one here,
// from the Timepiece's Finish. These are the colours of physical surfaces
// under studio light, not interface colours, which is why they are not
// tokens in globals.css.
//
// Steel is either left bare or blackened. Blackened steel is still a metal:
// it keeps its highlights and loses only its colour, and its coating blurs
// them a little.
const STEEL: Record<Steel, { color: string; coating: number }> = {
  steel: { color: "#c4c8cd", coating: 0 },
  black: { color: "#6e737b", coating: 0.06 },
};
// The hands and markers are filled with a pale luminous paint, so they are
// the first thing to show in the dark and the last to fade.
const LUME = "#dfe9f2";
const LUME_GLOW = 0.3;

// How rough each way of working the steel leaves it, before any coating.
const BRUSHED = 0.34;
const POLISHED = 0.16;

const steel = (kind: Steel, worked: number) => ({
  color: STEEL[kind].color,
  metalness: 1,
  roughness: worked + STEEL[kind].coating,
});

/**
 * One material per part, for a Timepiece in this Finish. The caller owns
 * them and disposes of them.
 */
export function createMaterials(finish: Finish): Record<Part, Material> {
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
      color: finish.dial,
      metalness: 0.35,
      roughness: 0.55,
    }),
    case: new MeshStandardMaterial(steel(finish.case, BRUSHED)),
    // The crown and pushers are cut from the case's steel, and polished.
    "crown-and-pushers": new MeshStandardMaterial(
      steel(finish.case, POLISHED),
    ),
    // The links are open shells, so both faces are drawn.
    bracelet: new MeshStandardMaterial({
      ...steel(finish.bracelet, BRUSHED),
      side: DoubleSide,
    }),
  };
}
