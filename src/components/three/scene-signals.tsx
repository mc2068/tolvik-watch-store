import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

import { isAutomated } from "@/components/three/device";
import {
  type FrameRateVerdict,
  judgeFrameRate,
} from "@/components/three/frame-rate";

// What a scene tells the section around it, which shows a Still in its
// place until the scene may be shown, and again if it is dropped. Both go
// inside a scene's <Canvas>.

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
 * Tells the section when the scene may be shown, or when the device cannot
 * keep up with it. Until its frame rate has been judged the scene draws
 * every frame, unseen behind its Still. Put it beside the model, inside the
 * Suspense that waits for it, so the frames judged are the model's.
 */
export function SteadyFrames({
  onSteady,
  onUnsteady,
}: {
  onSteady: () => void;
  onUnsteady: () => void;
}) {
  // An automated browser is not judged: it is shown as soon as it has drawn.
  const [judge] = useState(() => (isAutomated() ? null : judgeFrameRate()));
  const told = useRef<FrameRateVerdict>("judging");

  useFrame(({ invalidate }, delta) => {
    const verdict = judge ? judge.record(delta * 1000) : "steady";
    if (verdict === "judging") invalidate();
    if (verdict === told.current) return;

    told.current = verdict;
    if (verdict === "steady") onSteady();
    else onUnsteady();
  });

  return null;
}
