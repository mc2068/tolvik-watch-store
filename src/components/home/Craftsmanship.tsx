import { DialTrack } from "@/components/home/DialTrack";

const principles = [
  {
    name: "Legibility first",
    detail:
      "Plain batons, a doubled marker at twelve, and hands long enough to reach their track.",
  },
  {
    name: "Steel throughout",
    detail:
      "Case, crown and bracelet are cut from one grade of steel and brushed in one direction, so the watch reads as a single piece.",
  },
  {
    name: "Built to be opened",
    detail:
      "Every Tolvik is assembled so that a watchmaker can take it apart, service it and close it again.",
  },
];

export function Craftsmanship() {
  return (
    <section
      id="craftsmanship"
      aria-labelledby="craftsmanship-statement"
      className="overflow-hidden"
    >
      <div className="page-frame pb-section">
        {/* Phone and tablet: the dial is wider than the screen, so only its
            top arc shows, twelve in the middle, above the statement.
            Desktop: the whole dial stands beside the statement. */}
        <div className="relative pt-dial-arc lg:flex lg:min-h-viewport lg:flex-col lg:justify-center lg:py-24">
          <div className="pointer-events-none absolute -inset-x-gutter top-0 h-dial-arc overflow-hidden lg:inset-x-auto lg:top-1/2 lg:right-0 lg:h-auto lg:w-dial lg:-translate-y-1/2 lg:overflow-visible">
            <DialTrack className="absolute top-10 left-1/2 w-dial-wide max-w-none -translate-x-1/2 lg:static lg:w-full lg:translate-x-0" />
          </div>

          <h2
            id="craftsmanship-statement"
            className="relative mt-4 max-w-statement font-display text-display text-balance md:mt-8 lg:mt-0"
          >
            Made to be read in the dark.
          </h2>
          <p className="relative mt-8 max-w-measure text-lead text-platinum-dim md:mt-10">
            Tolvik makes steel watches in small numbers. Every dial is drawn
            for legibility first, because a northern winter leaves little light
            to read by.
          </p>
        </div>

        <dl className="mt-section grid gap-y-10 border-t border-line pt-10 md:gap-y-12 md:pt-14 lg:mt-0">
          {principles.map((principle) => (
            <div
              key={principle.name}
              className="grid gap-y-3 md:grid-cols-12 md:gap-x-8"
            >
              <dt className="font-display text-title md:col-span-5">
                {principle.name}
              </dt>
              <dd className="max-w-measure text-platinum-dim md:col-span-7 md:pt-2">
                {principle.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
