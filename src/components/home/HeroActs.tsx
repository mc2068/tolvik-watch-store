import { Arrival } from "@/components/home/Arrival";
import { ExplodedView } from "@/components/home/ExplodedView";
import { HeroStage } from "@/components/home/HeroStage";
import { Turn } from "@/components/home/Turn";
import type { Timepiece } from "@/lib/catalogue";
import { formatPrice } from "@/lib/price";

/**
 * The 3D acts of Home. The Hero Timepiece's stage is sticky: it holds its
 * place under the header while the acts scroll over it, so one watch stays
 * on screen from the first act to the last, and leaves with the last.
 */
export function HeroActs({
  heroTimepiece,
  href,
}: {
  heroTimepiece: Timepiece;
  /** Where the call to action that closes the acts leads. */
  href: string;
}) {
  return (
    <div>
      {/* A Shopper who prefers reduced motion keeps the Still beside the
          copy on a laptop. On a phone the copy would have to cross it, so
          there it leaves with the first screen. */}
      <div className="sticky top-header h-stage overflow-hidden motion-reduce:max-lg:static">
        <HeroStage finish={heroTimepiece.finish} />
      </div>

      {/* The acts are pulled up over the stage, so the first starts at the
          top of the page. They let the pointer through to the watch beneath
          them; only their copy takes it back. */}
      <div className="pointer-events-none relative -mt-stage">
        <Arrival />
        <Turn />
        <ExplodedView
          price={formatPrice(heroTimepiece.price)}
          href={href}
        />
      </div>
    </div>
  );
}
