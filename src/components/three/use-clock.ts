import { invalidate, useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useRef } from "react";
import { MathUtils, type Object3D } from "three";

import { handAngles } from "@/components/three/clock";
import { HANDS } from "@/components/three/hero-model";

/**
 * Keeps the Hero Timepiece's three hands on the Shopper's own clock. The
 * ref it returns goes on the `hands` part, which holds them.
 *
 * Every frame that is drawn sets the hands from the device's time, so the
 * clock runs through any act without knowing about it. The scene draws only
 * on demand, so the hook also asks for one frame as each second begins:
 * that frame is the tick.
 */
export function useClock(): RefObject<Object3D | null> {
  const handsPart = useRef<Object3D>(null);
  const canvas = useThree((three) => three.gl.domElement);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      invalidate();
      // Aimed at the start of the next second each time, so the ticks stay
      // on the second and a late timer is not carried forward.
      timer = setTimeout(tick, 1000 - (Date.now() % 1000));
    };

    // Tick only while the watch is on screen. Once the Stage has scrolled
    // away a tick would cost a frame nobody sees; when it returns, the first
    // frame puts the hands straight back on the time.
    const onScreen = new IntersectionObserver((sightings) => {
      clearTimeout(timer);
      if (sightings.at(-1)?.isIntersecting) tick();
    });
    onScreen.observe(canvas);

    return () => {
      onScreen.disconnect();
      clearTimeout(timer);
    };
  }, [canvas]);

  useFrame(() => {
    const now = new Date();
    // `scripts/render-stills.mjs` holds these three readings still.
    const angles = handAngles({
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    });
    for (const name of HANDS) {
      const hand = handsPart.current?.getObjectByName(name);
      // Each hand is modelled pointing at twelve, and a turn about Z runs
      // anticlockwise as the Shopper sees it: hence the minus.
      if (hand) hand.rotation.z = -MathUtils.degToRad(angles[name]);
    }
  });

  return handsPart;
}
