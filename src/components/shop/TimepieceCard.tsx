import Link from "next/link";

import { StillFrame } from "@/components/shop/StillFrame";
import type { Timepiece } from "@/lib/catalogue";
import { formatPrice } from "@/lib/price";
import { timepiecePath } from "@/lib/site";

/**
 * A Timepiece as a listing shows it: its Still from the front, its name and
 * its price. The whole of it opens the Timepiece's page.
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
    <article className="relative">
      <StillFrame still={still} sizes={sizes} />
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 border-t border-line pt-4">
        <h3 className="font-display text-title">
          {/* The link is the name alone, so that is all a screen reader
              reads out for it; its `after` layer is stretched over the
              article, so a click or a tap anywhere on it follows the link. */}
          <Link
            href={timepiecePath(timepiece.slug)}
            className="transition-colors duration-(--duration-quick) ease-settle after:absolute after:inset-0 hover:text-steel"
          >
            {timepiece.name}
          </Link>
        </h3>
        <p className="text-small tracking-open text-platinum-dim">
          {formatPrice(timepiece.price)}
        </p>
      </div>
      {note && <p className="mt-1 text-small text-platinum-dim">{note}</p>}
    </article>
  );
}
