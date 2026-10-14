import { notFound } from "next/navigation";

import { EscapementCloseUp } from "@/components/home/EscapementCloseUp";
import { ESCAPEMENT_VIEW } from "@/components/three/escapement-model";

// The studio's third room: the escapement, held still, for `npm run stills`
// to photograph. Like the others, it is open only in the build that script
// makes.
const studioOpen = process.env.TOLVIK_STUDIO === "1";

// The moment of the animation the Still shows, in seconds: the balance
// swung out and the escape wheel caught on a pallet stone, every part in
// plain view.
const HELD_AT = 1.2;

// How wide the scene is drawn, in CSS pixels; `npm run stills` photographs
// it at twice that.
const WIDTH = 900;

export default function EscapementStudio() {
  if (!studioOpen) notFound();

  return (
    <main className="py-10">
      <div
        className="mx-auto"
        style={{
          width: WIDTH,
          aspectRatio: `${ESCAPEMENT_VIEW.width} / ${ESCAPEMENT_VIEW.height}`,
        }}
      >
        <EscapementCloseUp heldAt={HELD_AT} className="size-full" />
      </div>
    </main>
  );
}
