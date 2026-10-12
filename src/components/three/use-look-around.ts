import { invalidate } from "@react-three/fiber";
import { type PointerEvent, type RefObject, useRef } from "react";
import { MathUtils } from "three";

// How far a drag across the whole stage turns the watch, in radians.
const REACH = { yaw: 1.1, pitch: 0.5 } as const;

export type LookAround = { yaw: number; pitch: number };

/**
 * Lets the Shopper drag the watch to look around it. `asked` is where the
 * drag currently wants the watch; the frame loop eases towards it. Letting
 * go asks for nothing, so the watch settles back into its Pose.
 * `handlers` go on the element the Shopper drags.
 */
export function useLookAround(): {
  asked: RefObject<LookAround>;
  handlers: Record<
    "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel",
    (event: PointerEvent<HTMLElement>) => void
  >;
} {
  const asked = useRef<LookAround>({ yaw: 0, pitch: 0 });
  const held = useRef<{ id: number; x: number; y: number } | null>(null);

  const hold = (event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    held.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<HTMLElement>) => {
    const from = held.current;
    if (event.pointerId !== from?.id) return;
    const { clientWidth, clientHeight } = event.currentTarget;
    const span = Math.min(clientWidth, clientHeight);
    const turn = (distance: number, reach: number) =>
      MathUtils.clamp((distance / span) * 2 * reach, -reach, reach);
    asked.current.yaw = turn(event.clientX - from.x, REACH.yaw);
    asked.current.pitch = turn(event.clientY - from.y, REACH.pitch);
    invalidate();
  };

  const letGo = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerId !== held.current?.id) return;
    held.current = null;
    asked.current.yaw = 0;
    asked.current.pitch = 0;
    invalidate();
  };

  return {
    asked,
    handlers: {
      onPointerDown: hold,
      onPointerMove: drag,
      onPointerUp: letGo,
      onPointerCancel: letGo,
    },
  };
}
