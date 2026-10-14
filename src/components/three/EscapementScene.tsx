"use client";

import {
  Environment,
  Lightformer,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  AnimationClip,
  AnimationMixer,
  type Mesh,
  type Object3D,
} from "three";

import { createEscapementMaterials } from "@/components/three/escapement-materials";
import {
  ESCAPEMENT_ANIMATION,
  ESCAPEMENT_MODEL,
  ESCAPEMENT_PIECES,
  ESCAPEMENT_VIEW,
  type EscapementPiece,
} from "@/components/three/escapement-model";
import { FirstFrame, LostContext } from "@/components/three/scene-signals";
import { token } from "@/lib/tokens";

// The camera: a long lens, as for the Hero Timepiece, looking down on the
// escapement as through an open caseback held a little away from the eye.
const LENS = 30;
// How the escapement is held: its far edge tipped away from the Shopper and
// turned a touch, so the wheels show their depth and the hairspring its
// coil. In radians.
const TILT = -0.62;
const TURN = 0.18;

// After a pause the gap since the last frame is long; the escapement steps on
// by no more than this, so it never leaps when it comes back into view.
const LONGEST_STEP = 1 / 30;

/**
 * The escapement's scene: canvas, camera, studio and the escapement playing
 * its animation on a loop. It is the default export so the craftsmanship
 * section can load it on the client only, once it is near.
 */
export default function EscapementScene({
  running,
  heldAt,
  onReady,
  onLost,
}: {
  /** Whether the escapement plays. Off screen it holds still, unseen. */
  running: boolean;
  /**
   * Holds the animation at this many seconds in, for the studio to
   * photograph. Left out, it plays.
   */
  heldAt?: number;
  /** The escapement has been drawn for the first time. */
  onReady: () => void;
  /** The browser has taken the scene's graphics memory back. */
  onLost: () => void;
}) {
  const playing = running && heldAt === undefined;

  return (
    // On demand, the scene draws its first frame and then only what it is
    // asked to; playing, it draws every frame. So the escapement costs nothing
    // until it is on screen, and nothing once it has scrolled away.
    <Canvas
      frameloop={playing ? "always" : "demand"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Camera />
      <Studio />
      <LostContext onLost={onLost} />
      <Suspense fallback={null}>
        <Escapement playing={playing} heldAt={heldAt} />
        <FirstFrame onDrawn={onReady} />
      </Suspense>
    </Canvas>
  );
}

/** The camera, set back far enough to see the escapement whole in any frame. */
function Camera() {
  const aspect = useThree((three) => three.size.width / three.size.height);
  const distance =
    Math.max(ESCAPEMENT_VIEW.width / aspect, ESCAPEMENT_VIEW.height) /
    (2 * Math.tan((LENS * Math.PI) / 360));

  return (
    <PerspectiveCamera
      makeDefault
      fov={LENS}
      position={[0, 0, distance]}
      near={0.5}
      far={20}
    />
  );
}

/**
 * The light: glowing panels around the escapement, rendered once into a
 * reflection map, and one lamp. Nothing is downloaded.
 */
function Studio() {
  const [steelBlue] = useState(() => token("--color-steel"));

  return (
    <>
      <directionalLight position={[-2, 4, 5]} intensity={0.8} />
      <Environment resolution={256} frames={1}>
        {/* The escapement lies tipped back, so its flat faces mirror the
            ceiling straight on. A dim ceiling keeps them a steel grey, and
            a narrow bright strip across it draws one band of light over
            each wheel instead of a sheet of white. */}
        <Lightformer
          form="rect"
          intensity={0.35}
          position={[0, 5, 2]}
          rotation-x={Math.PI / 2}
          scale={[8, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 5, 0.6]}
          rotation-x={Math.PI / 2}
          scale={[8, 0.5, 1]}
        />
        {/* A tall strip to one side, for a long highlight down each wheel. */}
        <Lightformer
          form="rect"
          intensity={1.6}
          position={[-5, 0.5, 2]}
          rotation-y={Math.PI / 2}
          scale={[1.4, 7, 1]}
        />
        {/* A cool edge from behind, in Tolvik's steel blue. */}
        <Lightformer
          form="rect"
          color={steelBlue}
          intensity={2}
          position={[3, 2, -6]}
          scale={[6, 3, 1]}
        />
      </Environment>
    </>
  );
}

/** The piece a mesh belongs to: the ancestor that is a child of the root. */
function pieceOf(mesh: Object3D): EscapementPiece {
  let piece = mesh;
  while (piece.parent && piece.parent.name !== "escapement") {
    piece = piece.parent;
  }
  if (!(ESCAPEMENT_PIECES as readonly string[]).includes(piece.name)) {
    throw new Error(`The escapement has no piece named ${piece.name}`);
  }
  return piece.name as EscapementPiece;
}

/** The escapement, each piece finished, playing its animation. */
function Escapement({
  playing,
  heldAt,
}: {
  playing: boolean;
  heldAt?: number;
}) {
  // `useGLTF` downloads and decodes the model, and pauses this component
  // (React's Suspense) until it is ready. The Draco decoder is switched off:
  // the model is meshopt-compressed and needs nothing fetched to decode it.
  const { scene, animations } = useGLTF(ESCAPEMENT_MODEL, false);
  const invalidate = useThree((three) => three.invalidate);

  const materials = useMemo(() => createEscapementMaterials(), []);
  useEffect(() => {
    scene.traverse((node) => {
      const mesh = node as Mesh;
      if (mesh.isMesh) mesh.material = materials[pieceOf(mesh)];
    });
    return () => {
      for (const material of Object.values(materials)) material.dispose();
    };
  }, [scene, materials]);

  // An animation mixer plays a model's animation on its nodes: here the one
  // the model comes with, looped, as its author made it.
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  useEffect(() => {
    const clip = AnimationClip.findByName(animations, ESCAPEMENT_ANIMATION);
    if (!clip) {
      throw new Error(`The escapement has no "${ESCAPEMENT_ANIMATION}"`);
    }
    mixer.clipAction(clip).play();
    if (heldAt !== undefined) mixer.setTime(heldAt);
    else mixer.update(0);
    invalidate();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [mixer, animations, scene, heldAt, invalidate]);

  useFrame((_, delta) => {
    if (playing) mixer.update(Math.min(delta, LONGEST_STEP));
  });

  return (
    <group rotation={[TILT, TURN, 0]}>
      <primitive object={scene} />
    </group>
  );
}
