import { readdirSync, statSync } from "node:fs";
import path from "node:path";

import { type Document, type Node, NodeIO } from "@gltf-transform/core";
import {
  EXTMeshoptCompression,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";
import { MeshoptDecoder } from "meshoptimizer";
import { beforeAll, describe, expect, test } from "vitest";

import {
  HAND_CAP,
  HANDS,
  HERO_MODEL,
  PARTS,
} from "@/components/three/hero-model";
import { creditLine, heroModelCredit } from "@/lib/credits";

// These tests read the two committed files that `npm run models` writes, so
// a regenerated model that breaks the names the scene relies on fails here.

const publicDir = path.resolve("public");
const fileOf = (url: string) => path.join(publicDir, url);

const KB = 1024;
const budget = { main: 1500 * KB, phone: 700 * KB };

const variants = ["main", "phone"] as const;
const models = {} as Record<(typeof variants)[number], Document>;

beforeAll(async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  for (const variant of variants) {
    models[variant] = await io.read(fileOf(HERO_MODEL[variant]));
  }
});

function nodeNamed(model: Document, name: string): Node {
  const found = model
    .getRoot()
    .listNodes()
    .filter((node) => node.getName() === name);
  expect(found, `nodes named ${name}`).toHaveLength(1);
  return found[0];
}

function triangles(model: Document): number {
  let count = 0;
  for (const mesh of model.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      count += primitive.getIndices()!.getCount() / 3;
    }
  }
  return count;
}

describe.each(variants)("the %s Hero Timepiece model", (variant) => {
  test("is made of the seven named parts and nothing else", () => {
    const scene = models[variant].getRoot().getDefaultScene()!;
    const [root, ...others] = scene.listChildren();
    expect(others).toHaveLength(0);
    expect(root.listChildren().map((part) => part.getName())).toEqual([
      ...PARTS,
    ]);
  });

  test("keeps the hands as hour, minute and second, with their cap", () => {
    const hands = nodeNamed(models[variant], "hands");
    expect(hands.listChildren().map((hand) => hand.getName())).toEqual([
      ...HANDS,
      HAND_CAP,
    ]);
  });

  test("has every hand pointing at twelve from the pivot", () => {
    const cap = getBounds(nodeNamed(models[variant], HAND_CAP));
    for (const name of HANDS) {
      const { min, max } = getBounds(nodeNamed(models[variant], name));
      const length = max[1];
      expect(length, `${name} reaches up`).toBeGreaterThan(0.3);
      // The hand starts under the cap and is far longer than it is wide.
      expect(min[1], `${name} starts at the pivot`).toBeGreaterThan(cap.min[1]);
      expect(min[1], `${name} starts at the pivot`).toBeLessThan(cap.max[1]);
      expect(max[0] - min[0], `${name} is slender`).toBeLessThan(length * 0.3);
      expect(Math.abs(max[0] + min[0]), `${name} is centred`).toBeLessThan(
        length * 0.02,
      );
    }
  });

  test("orders the hands by length and stacks them clear of each other", () => {
    const [hour, minute, second] = HANDS.map((name) =>
      getBounds(nodeNamed(models[variant], name)),
    );
    expect(hour.max[1]).toBeLessThan(minute.max[1] * 0.8);
    // Hour lowest, then minute, then second, so they can cross without
    // passing through one another.
    expect(hour.max[2]).toBeLessThan(minute.min[2]);
    expect(minute.max[2]).toBeLessThan(second.min[2]);
  });

  test("faces the Shopper, with the crown at three o'clock", () => {
    const centre = (name: string) => {
      const { min, max } = getBounds(nodeNamed(models[variant], name));
      return min.map((low, axis) => (low + max[axis]) / 2);
    };
    // Front to back along +Z: crystal, dial, dial base, then the bracelet.
    expect(centre("crystal")[2]).toBeGreaterThan(centre("dial")[2]);
    expect(centre("dial")[2]).toBeGreaterThan(centre("dial-base")[2]);
    expect(centre("dial-base")[2]).toBeGreaterThan(centre("bracelet")[2]);
    // The dial is centred on the axis, and the crown sits to its right.
    expect(Math.abs(centre("dial-base")[0])).toBeLessThan(0.001);
    expect(Math.abs(centre("dial-base")[1])).toBeLessThan(0.001);
    expect(centre("crown-and-pushers")[0]).toBeGreaterThan(0.9);
  });

  test("leaves every node untransformed, so a part moves from rest", () => {
    for (const node of models[variant].getRoot().listNodes()) {
      expect(node.getTranslation(), node.getName()).toEqual([0, 0, 0]);
      expect(node.getRotation(), node.getName()).toEqual([0, 0, 0, 1]);
      expect(node.getScale(), node.getName()).toEqual([1, 1, 1]);
    }
  });

  test("carries no source material, so each part is finished in code", () => {
    expect(models[variant].getRoot().listMaterials()).toHaveLength(0);
  });

  test("carries the artist's credit line", () => {
    const { copyright } = models[variant].getRoot().getAsset();
    expect(copyright).toBe(creditLine(heroModelCredit));
  });

  test("fits its download budget", () => {
    const { size } = statSync(fileOf(HERO_MODEL[variant]));
    expect(size).toBeLessThan(budget[variant]);
  });
});

test("the phone model is lighter than the main one", () => {
  expect(triangles(models.phone)).toBeLessThan(triangles(models.main) * (2 / 3));
  expect(statSync(fileOf(HERO_MODEL.phone)).size).toBeLessThan(
    statSync(fileOf(HERO_MODEL.main)).size,
  );
});

test("only the Hero Timepiece's two files ship as models", () => {
  const shipped = readdirSync(path.join(publicDir, "models")).sort();
  expect(shipped).toEqual(
    Object.values(HERO_MODEL)
      .map((url) => path.basename(url))
      .sort(),
  );
});
