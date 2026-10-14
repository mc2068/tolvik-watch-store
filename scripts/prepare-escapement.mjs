// Turns the escapement download in models-raw/ into the model the
// craftsmanship section shows: public/models/escapement.glb. `npm run
// models` runs it after the Hero Timepiece.
//
// The part names, the animation's name, the file's location and its budget,
// and what scene code may rely on, live in
// src/components/three/escapement-model.ts, which this script imports.

import { EXTMeshoptCompression } from "@gltf-transform/extensions";
import {
  getBounds,
  prune,
  quantize,
  reorder,
  resample,
  simplify,
  weld,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

import {
  ESCAPEMENT_ANIMATION,
  ESCAPEMENT_PARTS,
} from "../src/components/three/escapement-model.ts";
import { creditLine, escapementModelCredit } from "../src/lib/credits.ts";
import { readLicensedSource } from "./model-files.mjs";

// The only download this script opens, and the credit its licence asks for.
// models-raw/ holds this model twice; the hyphenated zip is a Blender file
// and is not used.
export const SOURCE = {
  archive: "models-raw/swiss_lever_escapement_mechanism.zip",
  credit: escapementModelCredit,
};

// Every node in the source that holds a piece of the escapement, by the name
// its author gave it, and the part it is. Each holds its mesh in a child of
// its own, and the animation turns the holder. The author's "fixations" are
// the bearings the staffs turn in, and "escapement" is the pallet fork alone.
const SOURCE_PARTS = {
  "Balance Wheel": "balance-wheel",
  Hsp0: "hairspring",
  "Balance Axle": "balance-staff",
  "Impulse Pin": "impulse-pin",
  escapement: "pallet-fork",
  Pallets: "pallet-stones",
  "escape wheel": "escape-wheel",
  Pin1: "banking-pins",
  Pin2: "banking-pins",
  fixations: "bearings",
};

// The source also has a lamp, which the scene's own studio replaces, and
// two holders that set the author's scale and up direction, which the
// prepared root replaces.
const DROPPED = ["Sketchfab_model", "Root", "Lamp"];

// Surfaces are simplified to this share of their triangles, but no surface
// moves by more than ERROR of its part's size: the hairspring is drawn with
// far more triangles than its coil needs, and the wheels' teeth keep their
// shape.
const RATIO = 0.5;
const ERROR = 0.0005;

// Positions, the hairspring's breathing among them, are stored to this many
// bits across each part, and normals to this many in each direction.
const POSITION_BITS = 14;
const NORMAL_BITS = 10;

/** Finds the holders of the escapement's pieces, each holding one mesh. */
function findHolders(source) {
  const holders = new Map();
  for (const node of source.getRoot().listNodes()) {
    if (!(node.getName() in SOURCE_PARTS)) continue;
    const [child, ...others] = node.listChildren();
    if (node.getMesh() || !child?.getMesh() || others.length > 0) {
      throw new Error(`${node.getName()} does not hold one mesh`);
    }
    if (holders.has(node.getName())) {
      throw new Error(`Source node ${node.getName()} appears twice`);
    }
    holders.set(node.getName(), node);
  }
  for (const name of Object.keys(SOURCE_PARTS)) {
    if (!holders.has(name)) throw new Error(`Source node ${name} is missing`);
  }
  return holders;
}

/**
 * Collects the parts under one root, in their order and named as the site
 * names them, and drops every other node.
 */
function rootParts(source, holders) {
  const root = source.createNode("escapement");
  for (const part of ESCAPEMENT_PARTS) {
    const pieces = [...holders]
      .filter(([name]) => SOURCE_PARTS[name] === part)
      .map(([, holder]) => holder);
    if (pieces.length === 1) {
      root.addChild(pieces[0].setName(part));
      continue;
    }
    const group = source.createNode(part);
    pieces.forEach((piece, i) =>
      group.addChild(piece.setName(`${part}-${i + 1}`)),
    );
    root.addChild(group);
  }
  for (const holder of holders.values()) {
    holder.listChildren()[0].setName("");
  }

  const inRoot = (node) => {
    for (let at = node; at; at = at.getParentNode()) {
      if (at === root) return true;
    }
    return false;
  };
  for (const node of source.getRoot().listNodes()) {
    if (inRoot(node)) continue;
    if (!DROPPED.includes(node.getName())) {
      throw new Error(`Source node ${node.getName()} is assigned to no part`);
    }
    node.dispose();
  }

  const scene = source.getRoot().getDefaultScene();
  for (const child of scene.listChildren()) scene.removeChild(child);
  scene.addChild(root).setName("Escapement");
  return root;
}

/**
 * Sets the root so that the escapement lies along +X, balance on the left,
 * centred on the origin and 2 units across. Its staffs already run along Z,
 * with the balance on the +Z side.
 */
function frame(root) {
  const at = (name) =>
    root
      .listChildren()
      .find((part) => part.getName() === name)
      .getWorldTranslation();
  const [bx, by] = at("balance-wheel");
  const [ex, ey] = at("escape-wheel");
  const turn = -Math.atan2(ey - by, ex - bx);
  root.setRotation([0, 0, Math.sin(turn / 2), Math.cos(turn / 2)]);

  const { min, max } = getBounds(root);
  const scale = 2 / (max[0] - min[0]);
  root.setScale([scale, scale, scale]);
  root.setTranslation(min.map((low, axis) => (-(low + max[axis]) / 2) * scale));
}

/** Takes off the source's materials, and the texture coordinates they used. */
function stripMaterials(source) {
  for (const mesh of source.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      primitive.setMaterial(null);
      primitive.setAttribute("TEXCOORD_0", null);
    }
  }
}

/** Builds the prepared escapement, ready to write. */
export async function prepareEscapement(io) {
  await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
  const source = await readLicensedSource(io, SOURCE);

  const animations = source.getRoot().listAnimations();
  if (
    animations.length !== 1 ||
    animations[0].getName() !== ESCAPEMENT_ANIMATION
  ) {
    throw new Error(
      `The source does not carry one animation, "${ESCAPEMENT_ANIMATION}"`,
    );
  }

  const root = rootParts(source, findHolders(source));
  frame(root);
  stripMaterials(source);

  const asset = source.getRoot().getAsset();
  asset.copyright = creditLine(SOURCE.credit);
  delete asset.generator;

  await source.transform(
    prune(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR }),
    resample(),
    quantize({ quantizePosition: POSITION_BITS, quantizeNormal: NORMAL_BITS }),
    reorder({ encoder: MeshoptEncoder }),
  );
  source.createExtension(EXTMeshoptCompression).setRequired(true);
  return source;
}

/** Triangles in each part, for the report. */
export function trianglesByPart(model) {
  const [root] = model.getRoot().getDefaultScene().listChildren();
  return Object.fromEntries(
    root.listChildren().map((part) => {
      let triangles = 0;
      part.traverse((node) => {
        for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
          triangles += primitive.getIndices().getCount() / 3;
        }
      });
      return [part.getName(), triangles];
    }),
  );
}
