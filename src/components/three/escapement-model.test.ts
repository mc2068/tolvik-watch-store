import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Document, type Node, NodeIO } from "@gltf-transform/core";
import {
  EXTMeshoptCompression,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";
import { MeshoptDecoder } from "meshoptimizer";
import { beforeAll, expect, test } from "vitest";

import {
  ESCAPEMENT_ANIMATION,
  ESCAPEMENT_MODEL,
  ESCAPEMENT_MODEL_BUDGET,
  ESCAPEMENT_PIECES,
} from "@/components/three/escapement-model";
import { creditLine, escapementModelCredit } from "@/lib/credits";

// These tests read the committed file that `npm run models` writes, so a
// regenerated model that breaks what the scene relies on fails here.

const file = path.join(
  fileURLToPath(new URL("../../../public", import.meta.url)),
  ESCAPEMENT_MODEL,
);

let model: Document;

beforeAll(async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  model = await io.read(file);
});

function nodeNamed(name: string): Node {
  const found = model
    .getRoot()
    .listNodes()
    .filter((node) => node.getName() === name);
  expect(found, `nodes named ${name}`).toHaveLength(1);
  return found[0];
}

function centre(node: Node): number[] {
  const { min, max } = getBounds(node);
  return min.map((low, axis) => (low + max[axis]) / 2);
}

test("is made of the named pieces and nothing else", () => {
  const scene = model.getRoot().getDefaultScene()!;
  const [root, ...others] = scene.listChildren();
  expect(others).toHaveLength(0);
  expect(root.getName()).toBe("escapement");
  expect(root.listChildren().map((piece) => piece.getName())).toEqual([
    ...ESCAPEMENT_PIECES,
  ]);
});

/** The piece a node belongs to: itself, or the ancestor just under the root. */
function pieceOf(node: Node): string {
  let piece = node;
  while (piece.getParentNode()?.getName() !== "escapement") {
    piece = piece.getParentNode()!;
  }
  return piece.getName();
}

test("holds each piece's pieces beneath it, the banking pins two", () => {
  for (const piece of ESCAPEMENT_PIECES) {
    const meshes: Node[] = [];
    nodeNamed(piece).traverse((node) => {
      if (node.getMesh()) meshes.push(node);
    });
    expect(meshes, piece).toHaveLength(piece === "banking-pins" ? 2 : 1);
  }
});

test("plays its own animation, which moves the pieces", () => {
  const animations = model.getRoot().listAnimations();
  expect(animations.map((animation) => animation.getName())).toEqual([
    ESCAPEMENT_ANIMATION,
  ]);

  const moved = new Set(
    animations[0]
      .listChannels()
      .map(
        (channel) =>
          `${pieceOf(channel.getTargetNode()!)} ${channel.getTargetPath()}`,
      ),
  );
  for (const motion of [
    "balance-wheel rotation",
    "balance-staff rotation",
    "impulse-pin rotation",
    "pallet-fork rotation",
    "pallet-stones rotation",
    "escape-wheel rotation",
    "hairspring weights",
  ]) {
    expect(moved, motion).toContain(motion);
  }
  for (const target of moved) {
    expect(ESCAPEMENT_PIECES, target).toContain(target.split(" ")[0]);
  }
});

test("lies across the frame, the balance nearest and on the left", () => {
  const { min, max } = getBounds(nodeNamed("escapement"));
  expect(max[0] - min[0]).toBeCloseTo(2, 3);
  expect(Math.abs(max[0] + min[0])).toBeLessThan(0.001);
  expect(Math.abs(max[1] + min[1])).toBeLessThan(0.001);
  // Wider than it is tall, and far wider than it is deep.
  expect(max[1] - min[1]).toBeLessThan(2);
  expect(max[2] - min[2]).toBeLessThan(0.6);

  // The balance on the left and the escape wheel on the right, level with
  // it, and the balance above the pallet fork, as the caseback shows them.
  const balance = centre(nodeNamed("balance-wheel"));
  const fork = centre(nodeNamed("pallet-fork"));
  const escapeWheel = centre(nodeNamed("escape-wheel"));
  expect(balance[0]).toBeLessThan(-0.2);
  expect(escapeWheel[0]).toBeGreaterThan(0.5);
  expect(Math.abs(balance[1] - escapeWheel[1])).toBeLessThan(0.05);
  expect(balance[2]).toBeGreaterThan(fork[2]);
});

test("carries no material or texture, so each piece is finished in code", () => {
  expect(model.getRoot().listMaterials()).toHaveLength(0);
  expect(model.getRoot().listTextures()).toHaveLength(0);
});

test("carries the artist's credit line", () => {
  expect(model.getRoot().getAsset().copyright).toBe(
    creditLine(escapementModelCredit),
  );
});

test("fits the phone budget", () => {
  expect(statSync(file).size).toBeLessThan(ESCAPEMENT_MODEL_BUDGET);
});
