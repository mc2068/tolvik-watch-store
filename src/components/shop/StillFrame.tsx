import Image from "next/image";

import type { Still } from "@/lib/catalogue";

/**
 * A Still in its frame: upright, and cropped to put the watch in the middle
 * of it, unless `className` gives it another shape. The Still has the page's
 * own black behind the watch, so nothing is drawn around it: the watch
 * stands on the page itself.
 */
export function StillFrame({
  still,
  sizes,
  first = false,
  className = "",
}: {
  still: Still;
  /** How wide the Still is shown, for the browser to pick a file by. */
  sizes: string;
  /** Whether the Still opens its page, and so is fetched at once. */
  first?: boolean;
  /** A shape for the frame other than its upright one, as `aspect-square`. */
  className?: string;
}) {
  return (
    // `next/image` serves the Still resized for the screen, in a modern
    // format, and holds its place in the layout while it loads. A Still is
    // nearly black, so it asks for the higher of the two qualities: see
    // `next.config.ts`.
    <div className={`still-frame ${className}`} data-view={still.view}>
      <Image
        src={still.src}
        alt={still.alt}
        fill
        sizes={sizes}
        quality={90}
        loading={first ? "eager" : "lazy"}
        fetchPriority={first ? "high" : "auto"}
      />
    </div>
  );
}
