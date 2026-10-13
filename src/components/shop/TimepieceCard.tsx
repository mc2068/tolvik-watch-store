import Image from "next/image";

import type { Timepiece } from "@/lib/catalogue";
import { formatPrice } from "@/lib/price";

/**
 * A Timepiece as a listing shows it: its Still, its name and its price. The
 * Still has the page's own black behind the watch, so it needs no frame.
 */
export function TimepieceCard({
  timepiece,
  sizes,
  note,
}: {
  timepiece: Timepiece;
  /** How wide the Still is shown, for the browser to pick a file by. */
  sizes: string;
  /** A quiet line under the name, where a listing has more to say. */
  note?: string;
}) {
  const [still] = timepiece.stills;

  return (
    <article>
      {/* `next/image` serves the Still resized for the screen, in a modern
          format, and holds its place in the layout while it loads. A Still
          is nearly black, so it asks for the higher of the two qualities:
          see `next.config.ts`. */}
      <div className="still-frame">
        <Image src={still.src} alt={still.alt} fill sizes={sizes} quality={90} />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 border-t border-line pt-4">
        <h3 className="font-display text-title">{timepiece.name}</h3>
        <p className="text-small tracking-open text-platinum-dim">
          {formatPrice(timepiece.price)}
        </p>
      </div>
      {note && <p className="mt-1 text-small text-platinum-dim">{note}</p>}
    </article>
  );
}
