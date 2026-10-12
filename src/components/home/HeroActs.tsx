import { Arrival } from "@/components/home/Arrival";
import { HeroStage } from "@/components/home/HeroStage";

/**
 * The 3D acts of Home. The Hero Timepiece's stage is sticky: it holds its
 * place under the header while the acts scroll over it, so one watch stays
 * on screen from the first act to the last, and leaves with the last.
 */
export function HeroActs() {
  return (
    <div>
      <div className="sticky top-header h-stage overflow-hidden">
        <HeroStage />
      </div>

      {/* The acts are pulled up over the stage, so the first starts at the
          top of the page. They let the pointer through to the watch beneath
          them; only their copy takes it back. */}
      <div className="pointer-events-none relative -mt-stage">
        <Arrival />
      </div>
    </div>
  );
}
