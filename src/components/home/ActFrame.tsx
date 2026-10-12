import type { ReactNode } from "react";

/**
 * Where an act's copy stands on the Stage: under the watch on a phone, to
 * its left on a laptop. `held` keeps the frame in place while the rest of
 * the act scrolls past, the way the Stage itself is held.
 *
 * For a Shopper who prefers reduced motion nothing is held. On a laptop the
 * frame is one plain screen beside the Still; on a phone, where the Still
 * has scrolled away with the first screen, it is as tall as its copy.
 */
export function ActFrame({
  held = false,
  children,
}: {
  held?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`h-stage motion-reduce:max-lg:h-auto ${held ? "sticky top-header motion-reduce:static" : ""}`}
    >
      {/* The copy is set against the foot of the screen as a phone shows it
          with its toolbars out, so none of it is ever under them. */}
      <div className="page-frame flex h-first-screen flex-col justify-end pb-12 lg:justify-center lg:pb-0 motion-reduce:max-lg:h-auto">
        <div className="pointer-events-auto lg:max-w-2/5 lg:pr-gutter">
          {children}
        </div>
      </div>
    </div>
  );
}
