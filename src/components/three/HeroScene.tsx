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
import { type DirectionalLight, type Group, MathUtils } from "three";

import {
  CAMERA_DISTANCE,
  containFov,
  LENS,
} from "@/components/three/framing";
import { HeroTimepiece } from "@/components/three/HeroTimepiece";
import { ARRIVED, poseAt } from "@/components/three/pose";
import { FirstFrame, LostContext } from "@/components/three/scene-signals";
import { useExplodedView } from "@/components/three/use-exploded-view";
import {
  type LookAround,
  useLookAround,
} from "@/components/three/use-look-around";
import { actProgress } from "@/lib/act-progress";
import type { Finish } from "@/lib/catalogue";
import { token } from "@/lib/tokens";

// The watch turns about the middle of its own depth, not about its dial, so
// the bracelet behind it does not swing wide.
const PIVOT_DEPTH = 0.9;

// The lamp's strength on a fully lit watch.
const KEY_LIGHT = 1.4;

// How quickly the watch follows a drag and settles after it, per second,
// and how close to where it was asked to be, in radians, counts as there.
const FOLLOW_RATE = 7;
const CLOSE_ENOUGH = 0.0005;

/**
 * The Hero Timepiece's scene: canvas, camera, studio and frame loop. It is
 * the default export so `LiveTimepiece` can load it on the client only,
 * after the page.
 */
export default function HeroScene({
  finish,
  arrived,
  onReady,
  onLost,
}: {
  /** The Finish the watch is made in. */
  finish: Finish;
  /** Whether the watch is held arrived, and does not follow the acts. */
  arrived: boolean;
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
        <Posed arrived={arrived} lookAround={lookAround.asked}>
          <HeroTimepiece finish={finish} />
        </Posed>
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
 * Holds the watch in its Pose every frame, lights it as the Pose says, and
 * adds the Shopper's drag.
 */
function Posed({
  arrived,
  lookAround,
  children,
}: {
  arrived: boolean;
  lookAround: RefObject<LookAround>;
  children: ReactNode;
}) {
  // Two groups, one inside the other. The outer one is the stand: where the
  // watch is, and the Shopper's drag, which always turns it about the
  // Stage's own upright and level axes. The inner one is which way the Pose
  // has the watch face on that stand.
  const stand = useRef<Group>(null);
  const watch = useRef<Group>(null);
  const keyLight = useRef<DirectionalLight>(null);
  const look = useRef<LookAround>({ yaw: 0, pitch: 0 });
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

    const pose = poseAt(
      arrived
        ? ARRIVED
        : {
            arrival: actProgress.get("arrival"),
            turn: actProgress.get("turn"),
            "exploded-view": actProgress.get("exploded-view"),
          },
      size.width / size.height,
    );

    watch.current.quaternion.set(...pose.facing);
    stand.current.position.set(...pose.place);
    stand.current.rotation.set(now.pitch, now.yaw, 0);
    scene.environmentIntensity = pose.light;
    scene.environmentRotation.y = pose.studioTurn;
    keyLight.current.intensity = KEY_LIGHT * pose.light;

    explode(pose.parts, camera, gl.domElement);
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
