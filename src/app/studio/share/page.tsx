import Image from "next/image";
import { notFound } from "next/navigation";

import { Wordmark } from "@/components/ui/Wordmark";
import { getHeroTimepiece } from "@/lib/catalogue";
import { SHARE_IMAGE } from "@/lib/site";

// The studio's share room: the card a link to the site shows where it is
// shared, laid out at the size of the image and photographed by `npm run
// stills` into `src/app/opengraph-image.jpg`. Like the other rooms, it is
// open only in the build that script makes.
const studioOpen = process.env.TOLVIK_STUDIO === "1";

export default async function ShareStudio() {
  if (!studioOpen) notFound();

  const [front] = (await getHeroTimepiece()).stills;

  return (
    <main
      data-share-card
      className="relative overflow-hidden bg-ink"
      style={{ width: SHARE_IMAGE.width, height: SHARE_IMAGE.height }}
    >
      {/* The Hero Timepiece as Home leaves it once it has arrived. The
          camera puts the watch left of the middle of its Still, so the
          Still stands a little past the card's right edge. */}
      <div
        className="absolute top-0 aspect-square"
        style={{ left: 600, height: SHARE_IMAGE.height }}
      >
        <Image
          src={front.src}
          alt=""
          fill
          sizes={`${SHARE_IMAGE.height}px`}
          quality={90}
          loading="eager"
          className="mix-blend-lighten"
        />
      </div>

      <div className="relative flex h-full w-[34rem] flex-col justify-between p-18">
        <Wordmark />
        <div>
          <p className="font-display text-[5.25rem] leading-[1.02] font-light tracking-[-0.022em]">
            The hour, in steel.
          </p>
          <p className="mt-8 text-lead text-platinum-dim">
            A concept storefront for an invented watch brand.
          </p>
        </div>
      </div>
    </main>
  );
}
