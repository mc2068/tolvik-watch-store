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

import { CAMERA_DISTANCE, containFov, LENS } from "@/components/three/framing";
import { HERO_MODEL, type Part, PARTS } from "@/components/three/hero-model";
import { ARRIVED, type Pose, poseAt } from "@/components/three/pose";

// The Stage's shape, width over height, on a laptop.
const LAPTOP = 1.6;

/** The Pose with each act this far along. */
const at = (arrival: number, turn = 0, explodedView = 0, aspect = LAPTOP) =>
  poseAt({ arrival, turn, "exploded-view": explodedView }, aspect);

// Directions fixed to the watch, as the model is built, and on the Stage,
// which the camera looks at down its Z axis.
const DIAL = [0, 0, 1] as const;
const CROWN = [1, 0, 0] as const;
const TOWARDS_THE_SHOPPER = 2;

// An act in a thousand steps.
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

const apart = (pose: Pose) =>
  PARTS.some((part) => pose.parts[part].separation > 0);
const fullyApart = (pose: Pose) =>
  PARTS.every((part) => pose.parts[part].separation === 1);

/** The Exploded View act, from the profile, in a thousand steps. */
const explodedViewAct = (aspect = LAPTOP) =>
  steps.map((step) => at(1, 1, step, aspect));

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
  const act = explodedViewAct();

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

  test("it opens front to back, with clear air between each part and the next", () => {
    const { parts } = act.find(fullyApart)!;

    for (let i = 1; i < PARTS.length; i++) {
      expect(
        parts[PARTS[i - 1]].offset - parts[PARTS[i]].offset,
      ).toBeGreaterThan(0.25);
    }
    // The case holds its place; the rest lift off it or drop behind it.
    expect(parts.case.offset).toBe(0);
    expect(parts.crystal.offset).toBeGreaterThan(1);
    expect(parts.bracelet.offset).toBeLessThan(-0.5);
  });

  test("it stays fully apart long enough for the seven names to be read", () => {
    expect(act.filter(fullyApart).length / act.length).toBeGreaterThan(0.1);
  });

  test("it ends exactly as it ended the arrival: same facing, same place, closed, fully lit", () => {
    expect(at(1, 1, 1)).toEqual(at(1));
    expect(apart(at(1, 1, 1))).toBe(false);
  });
});

test("a page with no acts holds the watch as the arrival act leaves it", () => {
  const held = poseAt(ARRIVED, LAPTOP);

  expect(held).toEqual(at(1));
  expect(held.light).toBe(1);
  expect(fromRest(held)).toBe(0);
  expect(apart(held)).toBe(false);
});

test("each act holds its first and last Pose outside its range", () => {
  expect(at(-0.5)).toEqual(at(0));
  expect(at(1.5)).toEqual(at(1));
  expect(at(1, -0.5)).toEqual(at(1, 0));
  expect(at(1, 1.5)).toEqual(at(1, 1));
  expect(at(1, 1, -0.5)).toEqual(at(1, 1, 0));
  expect(at(1, 1, 1.5)).toEqual(at(1, 1, 1));
});

describe("from one moment to the next", () => {
  // The most a Pose may change over a thousandth of an act, whatever it is
  // a change of: under two degrees of turn, a sixtieth of the case's width
  // of travel, a thirtieth of the light. A jump would be tens of times more.
  const SMALL = 0.03;

  /** The biggest change between two Poses, in whichever of those it is. */
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

  const expectNoJump = (walk: Pose[]) => {
    for (let i = 1; i < walk.length; i++) {
      expect(change(walk[i - 1], walk[i])).toBeLessThan(SMALL);
    }
  };

  test.each(SHAPES)(
    "the whole story never jumps, on a Stage %s times as wide as tall",
    (aspect) => {
      // The acts one after another, each picking up where the last ended.
      expectNoJump([
        ...steps.map((step) => at(step, 0, 0, aspect)),
        ...steps.map((step) => at(1, step, 0, aspect)),
        ...steps.map((step) => at(1, 1, step, aspect)),
      ]);
    },
  );

  test.each(SHAPES)(
    "nor where one act hands over to the next, on a Stage %s times as wide as tall",
    (aspect) => {
      // Scroll plays each act a little behind the Shopper's hand, so on a
      // brisk scroll one act is still finishing as the next begins. Here the
      // last fifth of each runs over the first fifth of the next.
      const overlap = steps.map((step) => step / 5);

      expectNoJump(overlap.map((step) => at(0.8 + step, step, 0, aspect)));
      expectNoJump(overlap.map((step) => at(1, 0.8 + step, step, aspect)));
    },
  );

  test.each(SHAPES)(
    "nor on any other way through the acts, on a Stage %s times as wide as tall",
    (aspect) => {
      // From every corner of what the three could be to the corner opposite,
      // all three moving at once, some forwards and some backwards.
      const corners = [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];

      for (const corner of corners) {
        expectNoJump(
          steps.map((step) => {
            const [arrival, turn, explodedView] = corner.map((start) =>
              start === 0 ? step : 1 - step,
            );
            return at(arrival, turn, explodedView, aspect);
          }),
        );
      }
    },
  );
});

// Phones are served the lighter model, so both are held to the same view.
describe.each(["main", "phone"] as const)(
  "on any Stage, the open watch, as the %s model",
  (version) => {
    // The scene hangs the model this far in front of the point the watch
    // turns about. It is `PIVOT_DEPTH` in HeroScene.tsx, repeated here
    // because a unit test cannot load the scene; change the two together.
    const PIVOT_DEPTH = 0.9;

    // Stage shapes, width over height, from a phone held upright to a laptop.
    const STAGES = [0.6, 0.75, 1, 1.33, 1.6, 1.8];

    // Every point of the committed model, part by part. The bracelet is a
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
            HERO_MODEL[version],
          ),
        );

      for (const part of PARTS) {
        points[part] = [];
        const [node] = model
          .getRoot()
          .listNodes()
          .filter((candidate) => candidate.getName() === part);
        // No node of the model carries a transform, so a point is where its
        // mesh says it is.
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
     * sideways and upright: 0 is the middle of the Stage and 1 its very
     * edge. `clearance` is how far in front of the camera its nearest point
     * is, in model units.
     */
    function reach(pose: Pose, aspect: number) {
      const facing = new Quaternion(...pose.facing);
      // Half of what the camera sees upright, for each unit of distance.
      const halfView = Math.tan((containFov(LENS, aspect) * Math.PI) / 360);
      const point = new Vector3();
      const reached = { sideways: 0, upright: 0, clearance: Infinity };

      for (const part of PARTS) {
        const lift = pose.parts[part].offset + PIVOT_DEPTH;
        for (const [x, y, z] of points[part]) {
          point.set(x, y, z + lift).applyQuaternion(facing);
          const distance = CAMERA_DISTANCE - (point.z + pose.place[2]);
          reached.clearance = Math.min(reached.clearance, distance);
          reached.sideways = Math.max(
            reached.sideways,
            Math.abs(point.x + pose.place[0]) / (distance * halfView * aspect),
          );
          reached.upright = Math.max(
            reached.upright,
            Math.abs(point.y + pose.place[1]) / (distance * halfView),
          );
        }
      }
      return reached;
    }

    test.each(STAGES)(
      "stays in the camera's view on a Stage %s times as wide as tall",
      (aspect) => {
        // Every twentieth step of the act in which the watch is at all apart.
        const open = explodedViewAct(aspect)
          .filter((_, step) => step % 20 === 0)
          .filter(apart);
        expect(open.length).toBeGreaterThan(10);

        for (const pose of open) {
          const { sideways, upright, clearance } = reach(pose, aspect);
          expect(sideways).toBeLessThan(1);
          expect(upright).toBeLessThan(1);
          expect(clearance).toBeGreaterThan(0);
        }
      },
    );

    test("fills a good share of the Stage, so it is not lost in it", () => {
      for (const aspect of STAGES) {
        const open = explodedViewAct(aspect).find(fullyApart)!;
        const { sideways, upright } = reach(open, aspect);

        expect(Math.max(sideways, upright)).toBeGreaterThan(0.6);
      }
    });
  },
);
