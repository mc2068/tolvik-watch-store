import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

import {
  DIAL_WORDMARK_SIZE,
  drawDialWordmark,
} from "@/components/three/dial-wordmark";
import { HAND_CAP, HANDS, HERO_MODEL } from "@/components/three/hero-model";
import { createMaterials } from "@/components/three/materials";
import { useClock } from "@/components/three/use-clock";
import type { Finish } from "@/lib/catalogue";

// The wordmark sits on the dial between its centre and twelve o'clock, a
// hair above the plate so the two surfaces never fight for the same pixel.
const WORDMARK = { width: 0.56, y: 0.33, lift: 0.002 } as const;

/** The Hero Timepiece: the prepared model, each part made in the Finish. */
export function HeroTimepiece({ finish }: { finish: Finish }) {
  // `useGLTF` downloads and decodes the model, and pauses this component
  // (React's Suspense) until it is ready. The Draco decoder is switched off:
  // the model is meshopt-compressed and needs nothing fetched to decode it.
  const { nodes } = useGLTF(HERO_MODEL.main, false);
  const handsPart = useClock();

  const materials = useMemo(() => createMaterials(finish), [finish]);
  useEffect(
    () => () => {
      for (const material of Object.values(materials)) material.dispose();
    },
    [materials],
  );

  return (
    <group>
      <primitive object={nodes.crystal} material={materials.crystal} />
      <primitive ref={handsPart} object={nodes.hands}>
        {HANDS.map((hand) => (
          <primitive
            key={hand}
            object={nodes[hand]}
            material={materials.hands}
          />
        ))}
        <primitive object={nodes[HAND_CAP]} material={materials.hands} />
      </primitive>
      <primitive object={nodes.dial} material={materials.dial} />
      <primitive object={nodes["dial-base"]} material={materials["dial-base"]}>
        <DialWordmark />
      </primitive>
      <primitive object={nodes.case} material={materials.case} />
      <primitive
        object={nodes["crown-and-pushers"]}
        material={materials["crown-and-pushers"]}
      />
      <primitive object={nodes.bracelet} material={materials.bracelet} />
    </group>
  );
}

/** The Tolvik wordmark, printed on the dial's plate. */
function DialWordmark() {
  const invalidate = useThree((three) => three.invalidate);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = DIAL_WORDMARK_SIZE.width;
    canvas.height = DIAL_WORDMARK_SIZE.height;
    const drawing = new CanvasTexture(canvas);
    drawing.colorSpace = SRGBColorSpace;
    drawing.anisotropy = 8;
    return drawing;
  }, []);

  useEffect(() => {
    let current = true;
    drawDialWordmark(texture.image).then(() => {
      if (!current) return;
      texture.needsUpdate = true;
      invalidate();
    });
    return () => {
      current = false;
    };
  }, [texture, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);

  const { width, height } = DIAL_WORDMARK_SIZE;

  return (
    <mesh position={[0, WORDMARK.y, WORDMARK.lift]}>
      <planeGeometry
        args={[WORDMARK.width, (WORDMARK.width * height) / width]}
      />
      <meshStandardMaterial
        map={texture}
        transparent
        depthWrite={false}
        metalness={0.2}
        roughness={0.6}
      />
    </mesh>
  );
}
