// The Hero Timepiece model as `npm run models` prepares it. Scene code
// addresses the model through these names only, never the source file's.
//
// What the scene may rely on:
//   - One root node, `hero-timepiece`, holds the seven parts.
//   - The watch faces +Z, twelve o'clock is +Y and the crown is on +X.
//   - The origin is the centre of the dial, where the hands pivot.
//   - The case is 2 units across.
//   - No node carries a transform, so every part starts from rest.
//   - No mesh carries a material; each part is finished in code.
//   - The bracelet's links are open shells, so its material must be
//     double-sided. Every other part can be drawn one-sided.
//   - The files are meshopt-compressed. drei's `useGLTF` decodes that
//     without any extra setup.

/** The seven parts, front to back along the watch's axis. */
export const PARTS = [
  "crystal",
  "hands",
  "dial",
  "dial-base",
  "case",
  "crown-and-pushers",
  "bracelet",
] as const;

export type Part = (typeof PARTS)[number];

/**
 * The three hands inside the `hands` part. Each is modelled pointing at
 * twelve with its pivot on the axis, so turning it clockwise by the Clock's
 * angle is one rotation about Z.
 */
export const HANDS = ["hour-hand", "minute-hand", "second-hand"] as const;

export type Hand = (typeof HANDS)[number];

/** The fixed centre cap that sits over the hands, also inside `hands`. */
export const HAND_CAP = "hand-cap";

/** Where the two variants are served from. Phones load the lighter one. */
export const HERO_MODEL = {
  main: "/models/hero-timepiece.glb",
  phone: "/models/hero-timepiece-phone.glb",
} as const;
