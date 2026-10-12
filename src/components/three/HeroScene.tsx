"use client";

import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { Canvas, invalidate, useFrame, useThree } from "@react-three/fiber";
import {
  type ReactNode,
  type RefObject,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type DirectionalLight,
  Euler,
  type Group,
  MathUtils,
  Quaternion,
} from "three";

import { arrivalPose } from "@/components/three/arrival";
import { explodedViewPose } from "@/components/three/exploded-view";
import { containFov, distanceToFit } from "@/components/three/framing";
import { HeroTimepiece } from "@/components/three/HeroTimepiece";
import { LOOKS } from "@/components/three/prototype-looks";
import { turnPose } from "@/components/three/turn";
import { useExplodedView } from "@/components/three/use-exploded-view";
import {
  type LookAround,
  useLookAround,
} from "@/components/three/use-look-around";
import { actProgress } from "@/lib/act-progress";
import {
  prototypeVariant,
  type Variant,
  VARIANT_KEYS,
} from "@/lib/prototype-variant";
import { token } from "@/lib/tokens";

// The camera: a long lens set well back, as a product photographer would
// use, so the watch is not distorted. The lens angle is in degrees and the
// distance in model units, where the case is 2 units across.
const LENS = 30;
const CAMERA_DISTANCE = 7.4;

// The watch turns about the middle of its own depth, not about its dial, so
// the bracelet behind it does not swing wide.
const PIVOT_DEPTH = 0.9;

// How the finished watch rests once it has arrived: a little short of square
// on, so the case shows its side, and tipped up slightly to the eye.
const REST = { yaw: -0.38, pitch: 0.1 } as const;
const RESTING = new Quaternion().setFromEuler(
  new Euler(REST.pitch, REST.yaw, 0),
);

// How the turn act leaves it: in profile, the crown towards the Shopper,
// just short of side on so the dial still catches the light.
const PROFILE = { yaw: -1.36, pitch: 0.06 } as const;
const IN_PROFILE = new Quaternion().setFromEuler(
  new Euler(PROFILE.pitch, PROFILE.yaw, 0),
);
// The studio is lit for a watch that faces the Shopper, and a watch in
// profile would show its side to the dark. So the studio turns with it, by
// this much about the upright axis, until one of its tall strips stands
// where the side of the case and the crown reflect it.
const PROFILE_STUDIO_TURN = 1.5;

// PROTOTYPE: how the watch lies in each variant's look.
const LYING_IN = Object.fromEntries(
  VARIANT_KEYS.map((key) => [
    key,
    new Quaternion().setFromEuler(new Euler(...LOOKS[key].lying)),
  ]),
) as Record<Variant, Quaternion>;

const KEY_LIGHT = 1.4;

// How quickly the watch follows a drag and settles after it, per second,
// and how close to where it was asked to be, in radians, counts as there.
const FOLLOW_RATE = 7;
const CLOSE_ENOUGH = 0.0005;

/**
 * The Hero Timepiece's scene: canvas, camera, studio and frame loop. It is
 * the default export so Home can load it on the client only, after the page.
 */
export default function HeroScene({
  onReady,
  onLost,
}: {
  /** The watch has been drawn for the first time. */
  onReady: () => void;
  /** The browser has taken the scene's graphics memory back. */
  onLost: () => void;
}) {
  const lookAround = useLookAround();

  return (
    // `frameloop="demand"` draws a frame only when something has changed,
    // so a watch at rest costs a phone one frame a second, for the tick, and
    // nothing once it is off screen. The pixel ratio is capped at 2:
    // beyond that a phone draws far more pixels than the eye can tell apart.
    //
    // `touch-pan-y` leaves a finger moving up or down the page to scroll it:
    // the browser keeps upright swipes for itself and hands over only the
    // sideways drags that turn the watch.
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      className="cursor-grab touch-pan-y active:cursor-grabbing"
      {...lookAround.handlers}
    >
      <Camera />
      <Studio />
      <LostContext onLost={onLost} />
      <Suspense fallback={null}>
        <Pose lookAround={lookAround.asked}>
          <HeroTimepiece />
        </Pose>
        <FirstFrame onDrawn={onReady} />
      </Suspense>
    </Canvas>
  );
}

/** The camera, its lens refitted whenever the canvas changes shape. */
function Camera() {
  const aspect = useThree((three) => three.size.width / three.size.height);

  return (
    <PerspectiveCamera
      makeDefault
      fov={containFov(LENS, aspect)}
      position={[0, 0, CAMERA_DISTANCE]}
      near={1}
      far={30}
    />
  );
}

/**
 * The light. Steel shows only what it reflects, so the studio is a set of
 * glowing panels around the watch, rendered once into a reflection map, with
 * one lamp for the dial. Nothing is downloaded.
 */
function Studio() {
  const [steelBlue] = useState(() => token("--color-steel"));

  return (
    <Environment resolution={256} frames={1}>
      {/* A soft ceiling, the main source. */}
      <Lightformer
        form="rect"
        intensity={1.1}
        position={[0, 6, 1]}
        rotation-x={Math.PI / 2}
        scale={[7, 4, 1]}
      />
      {/* Two tall strips, for the long highlights down the case and bracelet. */}
      <Lightformer
        form="rect"
        intensity={1.4}
        position={[-6, 0.5, 2]}
        rotation-y={Math.PI / 2}
        scale={[1.6, 8, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1}
        position={[6, 0, 0]}
        rotation-y={-Math.PI / 2}
        scale={[1, 8, 1]}
      />
      {/* A cool edge from behind, in Tolvik's steel blue. */}
      <Lightformer
        form="rect"
        color={steelBlue}
        intensity={2.4}
        position={[3, 2, -7]}
        scale={[7, 4, 1]}
      />
      {/* A small lamp high over the camera, which the crystal picks up as
          one soft glint and not as a sheet of white. */}
      <Lightformer
        form="circle"
        intensity={0.9}
        position={[-2.5, 4, 8]}
        rotation-y={Math.PI}
        scale={3}
      />
    </Environment>
  );
}

/**
 * Poses the watch every frame from the acts' progress and the Shopper's
 * drag, and brings the light up with it.
 */
function Pose({
  lookAround,
  children,
}: {
  lookAround: RefObject<LookAround>;
  children: ReactNode;
}) {
  // Two groups, one inside the other. The outer one is the stand: where the
  // watch is, and the Shopper's drag, which always turns it about the
  // Stage's own upright and level axes. The inner one is how the acts hold
  // the watch on that stand.
  const stand = useRef<Group>(null);
  const watch = useRef<Group>(null);
  const keyLight = useRef<DirectionalLight>(null);
  const look = useRef<LookAround>({ yaw: 0, pitch: 0 });
  const [arrived] = useState(() => new Euler());
  const explode = useExplodedView(watch);

  // Draw a frame whenever scroll moves an act.
  useEffect(() => actProgress.onChange(() => invalidate()), []);

  useFrame(({ scene, camera, size, gl }, delta) => {
    if (!stand.current || !watch.current || !keyLight.current) return;

    // After a pause the gap since the last frame is long; cap it so the
    // first frame of a drag eases in and does not snap.
    const step = Math.min(delta, 1 / 30);
    const { current: now } = look;
    const { current: goal } = lookAround;
    now.yaw = MathUtils.damp(now.yaw, goal.yaw, FOLLOW_RATE, step);
    now.pitch = MathUtils.damp(now.pitch, goal.pitch, FOLLOW_RATE, step);
    const settling =
      Math.abs(now.yaw - goal.yaw) > CLOSE_ENOUGH ||
      Math.abs(now.pitch - goal.pitch) > CLOSE_ENOUGH;
    if (settling) invalidate();

    const arrival = arrivalPose(actProgress.get("arrival"));
    const { turned } = turnPose(actProgress.get("turn"));
    const explodedView = actProgress.get("exploded-view");
    const { laid, apart, risen } = explodedViewPose(explodedView);
    // PROTOTYPE: the variant in effect decides the open watch's look.
    const variant = prototypeVariant.get();
    const open = LOOKS[variant];

    // A slerp is the shortest turn from one way of holding the watch to
    // another. The acts chain three: round to the profile, down onto its
    // back, and up again to rest.
    arrived.set(REST.pitch + arrival.pitch, REST.yaw + arrival.yaw, 0);
    watch.current.quaternion
      .setFromEuler(arrived)
      .slerp(IN_PROFILE, turned)
      .slerp(LYING_IN[variant], laid)
      .slerp(RESTING, risen);

    const lying = laid * (1 - risen);
    const lyingDepth =
      distanceToFit(open.layout, LENS, size.width / size.height) -
      CAMERA_DISTANCE;
    stand.current.position.set(
      open.place.x * lying,
      open.place.y * lying,
      -arrival.depth - lyingDepth * lying,
    );
    stand.current.rotation.set(now.pitch, now.yaw, 0);
    scene.environmentIntensity = arrival.light;
    scene.environmentRotation.y =
      PROFILE_STUDIO_TURN *
      turned *
      (1 - (open.keepsStudioTurn ? risen : laid));
    keyLight.current.intensity = KEY_LIGHT * arrival.light;

    explode(apart, camera, gl.domElement, explodedView);
  });

  return (
    <>
      <directionalLight ref={keyLight} position={[-3, 5, 6]} intensity={0} />
      <group ref={stand}>
        <group ref={watch}>
          <group position-z={PIVOT_DEPTH}>{children}</group>
        </group>
      </group>
    </>
  );
}

/**
 * Tells Home when the browser drops the scene. A phone does this to a page
 * left in the background, and the canvas goes blank; Home then shows the
 * Still again.
 */
function LostContext({ onLost }: { onLost: () => void }) {
  const canvas = useThree((three) => three.gl.domElement);

  useEffect(() => {
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [canvas, onLost]);

  return null;
}

/** Tells Home when the watch has been drawn, so the Still can step aside. */
function FirstFrame({ onDrawn }: { onDrawn: () => void }) {
  const told = useRef(false);

  useFrame(() => {
    if (told.current) return;
    told.current = true;
    onDrawn();
  });

  return null;
}
