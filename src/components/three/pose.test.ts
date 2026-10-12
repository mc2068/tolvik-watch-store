import path from "node:path";
import { fileURLToPath } from "node:url";

import { NodeIO } from "@gltf-transform/core";
import {
  EXTMeshoptCompression,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { Quaternion, Vector3 } from "three";
import { beforeAll, describe, expect, test } from "vitest";

import { partOffsets } from "@/components/three/exploded-view";
import { CAMERA_DISTANCE, containFov, LENS } from "@/components/three/framing";
import { HERO_MODEL, type Part, PARTS } from "@/components/three/hero-model";
import { type Pose, poseAt } from "@/components/three/pose";

// The Stage's shape, width over height, on a laptop.
const LAPTOP = 1.6;

/** The Pose with each Act this far along. */
const at = (arrival: number, turn = 0, explodedView = 0, aspect = LAPTOP) =>
  poseAt({ arrival, turn, "exploded-view": explodedView }, aspect);

// Directions fixed to the watch, as the model is built, and on the Stage,
// which the camera looks at down its Z axis.
const DIAL = [0, 0, 1] as const;
const CROWN = [1, 0, 0] as const;
const TOWARDS_THE_SHOPPER = 2;

// An Act in a thousand steps.
const steps = Array.from({ length: 1001 }, (_, step) => step / 1000);

/** Where a direction fixed to the watch points once the watch is posed. */
const pointing = (direction: readonly [number, number, number], pose: Pose) =>
  new Vector3(...direction)
    .applyQuaternion(new Quaternion(...pose.facing))
    .toArray();

/** The angle, in radians, the watch turns through between two Poses. */
const turnBetween = (one: Pose, other: Pose) =>
  new Quaternion(...one.facing).angleTo(new Quaternion(...other.facing));

/** How far, in model units, the watch stands from its resting place. */
const fromRest = (pose: Pose) => Math.hypot(...pose.place);

describe("through the arrival act", () => {
  test("the watch opens turned away, set back and barely lit", () => {
    const opening = at(0);

    // Dim, but never dark: the first screen always shows the watch.
    expect(opening.light).toBeGreaterThan(0);
    expect(opening.light).toBeLessThan(0.3);
    expect(opening.place[TOWARDS_THE_SHOPPER]).toBeLessThan(-1);
    expect(turnBetween(opening, at(1))).toBeGreaterThan(0.3);
  });

  test("it ends at rest: in its place, dial to the Shopper, fully lit", () => {
    const arrived = at(1);

    expect(arrived.light).toBe(1);
    expect(fromRest(arrived)).toBe(0);
    expect(pointing(DIAL, arrived)[TOWARDS_THE_SHOPPER]).toBeGreaterThan(0.9);
  });

  test("it only ever brightens and comes closer as the Shopper scrolls on", () => {
    for (let i = 1; i < steps.length; i++) {
      const [before, after] = [at(steps[i - 1]), at(steps[i])];
      expect(after.light).toBeGreaterThanOrEqual(before.light);
      expect(fromRest(after)).toBeLessThanOrEqual(fromRest(before));
    }
  });
});

describe("through the turn act", () => {
  test("the watch ends in profile, the crown pointing at the Shopper", () => {
    const inProfile = at(1, 1);

    expect(pointing(CROWN, inProfile)[TOWARDS_THE_SHOPPER]).toBeGreaterThan(
      0.95,
    );
    // Just short of side on, so the dial still catches the light.
    expect(pointing(DIAL, inProfile)[TOWARDS_THE_SHOPPER]).toBeGreaterThan(0);
    // It has turned where it stood, and nothing has dimmed.
    expect(fromRest(inProfile)).toBe(0);
    expect(inProfile.light).toBe(1);
  });

  test("the studio turns with it, so its side is not shown to the dark", () => {
    expect(at(1, 0).studioTurn).toBe(0);
    // About a quarter turn, as the watch has made.
    expect(at(1, 1).studioTurn).toBeGreaterThan(1.2);
    expect(at(1, 1).studioTurn).toBeLessThan(1.8);
  });

  test("the profile is seen at rest before the act is over", () => {
    expect(at(1, 0.9)).toEqual(at(1, 1));
  });

  test("it only ever turns one way as the Shopper scrolls on", () => {
    const arrived = at(1);
    for (let i = 1; i < steps.length; i++) {
      const [before, after] = [at(1, steps[i - 1]), at(1, steps[i])];
      expect(turnBetween(arrived, after)).toBeGreaterThanOrEqual(
        turnBetween(arrived, before),
      );
      expect(after.studioTurn).toBeGreaterThanOrEqual(before.studioTurn);
    }
  });
});

describe("through the Exploded View act", () => {
  const apart = (pose: Pose) =>
    PARTS.some((part) => pose.parts[part].separation > 0);
  const fullyApart = (pose: Pose) =>
    PARTS.every((part) => pose.parts[part].separation === 1);
  const act = steps.map((step) => at(1, 1, step));

  test("the watch opens closed, every part in its place", () => {
    const [opening] = act;

    expect(apart(opening)).toBe(false);
    for (const part of PARTS) {
      expect(Math.abs(opening.parts[part].offset)).toBe(0);
    }
  });

  test("while it is apart its axis stands upright, dial up", () => {
    const open = act.filter(apart);
    expect(open.length).toBeGreaterThan(0);

    for (const pose of open) {
      const [aside, up, towardsTheShopper] = pointing(DIAL, pose);
      expect(up).toBeGreaterThan(0.9);
      expect(aside).toBeCloseTo(0, 10);
      // Tipped a little to the Shopper, who looks down onto each part.
      expect(towardsTheShopper).toBeGreaterThan(0);
    }
  });

  test("it lies still while it is apart", () => {
    const [lying, ...rest] = act.filter(apart);

    for (const pose of rest) {
      expect(pose.facing).toEqual(lying.facing);
      expect(pose.place).toEqual(lying.place);
    }
  });

  test("lying down, it steps back and to the Shopper's left, in studio light that has turned back", () => {
    const [lying] = act.filter(apart);
    const [aside, , towardsTheShopper] = lying.place;

    expect(aside).toBeLessThan(0);
    expect(towardsTheShopper).toBeLessThan(0);
    expect(lying.studioTurn).toBe(0);
    expect(lying.light).toBe(1);
  });

  test("it opens into the Exploded View's layout, each part in its place", () => {
    const open = act.find(fullyApart)!;
    const layout = partOffsets(1);

    for (const part of PARTS) {
      expect(open.parts[part].offset).toBe(layout[part]);
    }
  });

  test("it stays fully apart long enough for the seven names to be read", () => {
    expect(act.filter(fullyApart).length / act.length).toBeGreaterThan(0.1);
  });

  test("it ends exactly as it ended the arrival: same facing, same place, closed, fully lit", () => {
    expect(at(1, 1, 1)).toEqual(at(1));
    expect(apart(at(1, 1, 1))).toBe(false);
  });
});

test("each Act holds its first and last Pose outside its range", () => {
  expect(at(-0.5)).toEqual(at(0));
  expect(at(1.5)).toEqual(at(1));
  expect(at(1, -0.5)).toEqual(at(1, 0));
  expect(at(1, 1.5)).toEqual(at(1, 1));
  expect(at(1, 1, -0.5)).toEqual(at(1, 1, 0));
  expect(at(1, 1, 1.5)).toEqual(at(1, 1, 1));
});

describe("from one moment to the next", () => {
  // The most a Pose may change over a thousandth of an Act: under two
  // degrees of turn, or a part of the watch moving by less than a sixtieth
  // of the case's width. The quickest move in the Acts comes to four fifths
  // of this, and a jump would be tens of times more.
  const SMALL = 0.03;

  /** The biggest change between two Poses, whatever it is a change of. */
  const change = (before: Pose, after: Pose) =>
    Math.max(
      turnBetween(before, after),
      Math.hypot(...after.place.map((to, axis) => to - before.place[axis])),
      Math.abs(after.light - before.light),
      Math.abs(after.studioTurn - before.studioTurn),
      ...PARTS.flatMap((part) => [
        Math.abs(after.parts[part].offset - before.parts[part].offset),
        Math.abs(after.parts[part].separation - before.parts[part].separation),
      ]),
    );

  // The Stage's shape on a phone held upright, where the open watch stands
  // nearer, and on a laptop, where it steps furthest back.
  const SHAPES = [0.6, LAPTOP];

  test("the whole story never jumps, nor where one Act hands over to the next", () => {
    for (const aspect of SHAPES) {
      // The Acts one after another, each picking up where the last ended.
      const story = [
        ...steps.map((step) => at(step, 0, 0, aspect)),
        ...steps.map((step) => at(1, step, 0, aspect)),
        ...steps.map((step) => at(1, 1, step, aspect)),
      ];

      for (let i = 1; i < story.length; i++) {
        expect(change(story[i - 1], story[i])).toBeLessThan(SMALL);
      }
    }
  });

  test("nor does any other way through the Acts, which a brisk scroll can take", () => {
    // Scroll plays each Act a little behind the Shopper's hand, so one Act
    // can still be finishing as the next begins. These cross from every
    // corner of what the three could be to the corner opposite, all three
    // moving at once, forwards or backwards.
    const crossings = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ].map((from) =>
      steps.map((step) => {
        const [arrival, turn, explodedView] = from.map((start) =>
          start === 0 ? step : 1 - step,
        );
        return at(arrival, turn, explodedView);
      }),
    );

    for (const crossing of crossings) {
      for (let i = 1; i < crossing.length; i++) {
        expect(change(crossing[i - 1], crossing[i])).toBeLessThan(SMALL);
      }
    }
  });
});

describe("on any Stage, the open watch", () => {
  // The scene hangs the model this far in front of the point the watch turns
  // about. It is `PIVOT_DEPTH` in HeroScene.tsx, repeated here because a unit
  // test cannot load the scene; change the two together.
  const PIVOT_DEPTH = 0.9;

  // Stage shapes, width over height, from a phone held upright to a laptop.
  const STAGES = [0.6, 0.75, 1, 1.33, 1.6, 1.8];

  // Every point of the committed model, Part by Part. The bracelet is a
  // ring, so its box would claim corners where there is no steel.
  const points = {} as Record<Part, number[][]>;

  beforeAll(async () => {
    await MeshoptDecoder.ready;
    const model = await new NodeIO()
      .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
      .registerDependencies({ "meshopt.decoder": MeshoptDecoder })
      .read(
        path.join(
          fileURLToPath(new URL("../../../public", import.meta.url)),
          HERO_MODEL.main,
        ),
      );

    for (const part of PARTS) {
      points[part] = [];
      const [node] = model
        .getRoot()
        .listNodes()
        .filter((candidate) => candidate.getName() === part);
      node.traverse((child) => {
        for (const primitive of child.getMesh()?.listPrimitives() ?? []) {
          const positions = primitive.getAttribute("POSITION")!;
          for (let i = 0; i < positions.getCount(); i++) {
            points[part].push(positions.getElement(i, []));
          }
        }
      });
      expect(points[part].length, `points in the ${part}`).toBeGreaterThan(0);
    }
  });

  /**
   * How far towards the edge of the camera's view the posed watch reaches,
   * sideways and upright: 0 is the middle of the Stage and 1 its very edge.
   */
  function reach(pose: Pose, aspect: number) {
    const turn = new Quaternion(...pose.facing);
    const upright = Math.tan((containFov(LENS, aspect) * Math.PI) / 360);
    const point = new Vector3();
    const furthest = { sideways: 0, upright: 0, nearest: Infinity };

    for (const part of PARTS) {
      const lift = pose.parts[part].offset + PIVOT_DEPTH;
      for (const [x, y, z] of points[part]) {
        point.set(x, y, z + lift).applyQuaternion(turn);
        const away = CAMERA_DISTANCE - (point.z + pose.place[2]);
        furthest.nearest = Math.min(furthest.nearest, away);
        furthest.sideways = Math.max(
          furthest.sideways,
          Math.abs(point.x + pose.place[0]) / (away * upright * aspect),
        );
        furthest.upright = Math.max(
          furthest.upright,
          Math.abs(point.y + pose.place[1]) / (away * upright),
        );
      }
    }
    return furthest;
  }

  test.each(STAGES)(
    "stays in the camera's view on a Stage %s times as wide as tall",
    (aspect) => {
      // Every fiftieth of the act in which the watch is at all apart.
      const open = Array.from({ length: 51 }, (_, step) =>
        at(1, 1, step / 50, aspect),
      ).filter((pose) => PARTS.some((part) => pose.parts[part].separation > 0));
      expect(open.length).toBeGreaterThan(10);

      for (const pose of open) {
        const { sideways, upright, nearest } = reach(pose, aspect);
        expect(sideways).toBeLessThan(1);
        expect(upright).toBeLessThan(1);
        expect(nearest).toBeGreaterThan(0);
      }
    },
  );

  test("fills a good share of the Stage, so it is not lost in it", () => {
    for (const aspect of STAGES) {
      const { sideways, upright } = reach(at(1, 1, 0.57, aspect), aspect);
      expect(Math.max(sideways, upright)).toBeGreaterThan(0.6);
    }
  });
});
