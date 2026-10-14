// The escapement model as `npm run models` prepares it: the close-up in
// Home's craftsmanship section of what keeps a mechanical watch running.
// The names of its pieces are set here, once: the prepare script imports
// them, and scene code addresses the model through them, never through the
// source file's names.
//
// What the scene may rely on:
//   - One root node, `escapement`, holds the pieces and nothing else.
//   - The escapement lies along X and is seen from +Z, as through a watch's
//     open caseback: the balance wheel on the left, under its hairspring and
//     above the pallet fork, and the escape wheel on the right.
//   - The origin is the middle of the escapement, and it is 2 units across.
//   - Each piece is one named node, with its mesh in an unnamed node beneath
//     it; the banking pins, a pair, have two. A piece is finished by giving
//     every mesh under it the piece's material. (They are pieces, not
//     Parts: Parts are the Hero Timepiece's seven layers.)
//   - The animation `ESCAPEMENT_ANIMATION` lasts under seven seconds and is
//     played on a loop: the balance swings, the fork rocks and the escape
//     wheel advances a tooth at a time. It turns the pieces' own nodes, and
//     the hairspring breathes by a morph target on its mesh.
//   - No mesh carries a material. Some of the source's surfaces are open,
//     so every material is double-sided.
//   - The file is quantized and meshopt-compressed. drei's `useGLTF` reads
//     both without any extra setup.

/** The pieces, from the balance at one end of the escapement to the other. */
export const ESCAPEMENT_PIECES = [
  "balance-wheel",
  "hairspring",
  "balance-staff",
  "impulse-pin",
  "pallet-fork",
  "pallet-stones",
  "escape-wheel",
  "banking-pins",
  "bearings",
] as const;

export type EscapementPiece = (typeof ESCAPEMENT_PIECES)[number];

/** The animation the model comes with, by the name its author gave it. */
export const ESCAPEMENT_ANIMATION = "Oscillating mechanism";

/** Where the model is served from. One file, light enough for a phone. */
export const ESCAPEMENT_MODEL = "/models/escapement.glb";

/**
 * The most the file may weigh, in bytes: the phone budget. The escapement
 * is in 3D only because a phone can afford it, and `npm run models` writes
 * no file that goes over it. Should it ever stop fitting, the close-up is
 * to be its Still alone.
 */
export const ESCAPEMENT_MODEL_BUDGET = 400 * 1024;

/**
 * The Still in the escapement's place until its scene has drawn, and for
 * good wherever the 3D never comes, as `npm run stills` renders it.
 */
export const ESCAPEMENT_STILL = "/stills/escapement.webp";

/**
 * What the scene's camera keeps in view, in model units: the escapement,
 * tipped back, with a margin. The Still is photographed at this shape, so
 * shown with `object-fit: contain` in a box of any shape it lays the
 * escapement where the scene draws it.
 */
export const ESCAPEMENT_VIEW = { width: 2.4, height: 1.6 } as const;
