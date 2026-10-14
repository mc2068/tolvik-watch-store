import Image from "next/image";
import { notFound } from "next/navigation";

import { Wordmark } from "@/components/ui/Wordmark";
import { getHeroTimepiece } from "@/lib/catalogue";
import { SHARE_CARD } from "@/lib/site";

// The studio's fourth room: the Share card, laid out at its own size for
// `npm run stills` to photograph into `src/app/opengraph-image.jpg`. Like
// the others, it is open only in the build that script makes.
const studioOpen = process.env.TOLVIK_STUDIO === "1";

// How far from the card's left edge the Still stands, in CSS pixels. The
// camera puts the watch left of the middle of its Still, so the Still runs a
// little past the card's right edge to bring the watch into the right half.
const STILL_LEFT = 600;

export default async function ShareStudio() {
  if (!studioOpen) notFound();

  const [front] = (await getHeroTimepiece()).stills;

  return (
    <main
      data-share-card
      className="relative overflow-hidden bg-ink"
      style={{ width: SHARE_CARD.width, height: SHARE_CARD.height }}
    >
      {/* The Hero Timepiece as Home leaves it once it has arrived. */}
      <div
        className="absolute top-0 aspect-square"
        style={{ left: STILL_LEFT, height: SHARE_CARD.height }}
      >
        <Image
          src={front.src}
          alt=""
          fill
          sizes={`${SHARE_CARD.height}px`}
          quality={90}
          loading="eager"
          className="mix-blend-lighten"
        />
      </div>

      {/* Home's headline, at the size Home sets it in a window this wide. */}
      <div className="relative flex h-full w-measure flex-col justify-between p-18">
        <Wordmark />
        <div>
          <p className="font-display text-display">The hour, in steel.</p>
          <p className="mt-8 text-lead text-platinum-dim">
            A concept storefront for an invented watch brand.
          </p>
        </div>
      </div>
    </main>
  );
}
