import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

// What a scene tells the section around it, which shows a Still in its
// place until the scene has drawn and again if it is lost. Both go inside
// a scene's <Canvas>.

/**
 * Tells the section when the browser drops the scene. A phone does this to
 * a page left in the background, and the canvas goes blank; the section
 * then shows the Still again.
 */
export function LostContext({ onLost }: { onLost: () => void }) {
  const canvas = useThree((three) => three.gl.domElement);

  useEffect(() => {
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [canvas, onLost]);

  return null;
}

/**
 * Tells the section when the scene has been drawn for the first time, so
 * the Still can step aside. Put it beside the model, inside the Suspense
 * that waits for it.
 */
export function FirstFrame({ onDrawn }: { onDrawn: () => void }) {
  const told = useRef(false);

  useFrame(() => {
    if (told.current) return;
    told.current = true;
    onDrawn();
  });

  return null;
}
