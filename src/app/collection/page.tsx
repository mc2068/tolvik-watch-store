import type { Metadata } from "next";

import { TimepieceCard } from "@/components/shop/TimepieceCard";
import { listCollections, listTimepieces } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "Every Tolvik Timepiece, by Collection, in brushed and in blackened steel.",
};

// A server component may be an async function: it waits for its data on the
// server and sends the browser finished HTML, with no loading state to draw.
export default async function CollectionPage() {
  const [collections, timepieces] = await Promise.all([
    listCollections(),
    listTimepieces(),
  ]);

  return (
    <main className="page-frame pb-section">
      <header className="pt-section pb-16 md:pb-24">
        <h1 className="max-w-statement font-display text-display text-balance">
          The Collection
        </h1>
        <p className="mt-8 max-w-measure text-lead text-platinum-dim md:mt-10">
          Six Timepieces on one case, in two Collections. Choose the steel,
          brushed or blackened, then the colour of the dial.
        </p>
      </header>

      <div className="grid gap-y-section">
        {collections.map((collection) => (
          <section
            key={collection.slug}
            id={collection.slug}
            aria-labelledby={`${collection.slug}-heading`}
            className="border-t border-line pt-10 md:pt-14"
          >
            <div className="grid gap-y-3 md:grid-cols-12 md:gap-x-8">
              <h2
                id={`${collection.slug}-heading`}
                className="font-display text-title md:col-span-5"
              >
                {collection.name}
              </h2>
              <p className="max-w-measure text-platinum-dim md:col-span-7 md:pt-2">
                {collection.description}
              </p>
            </div>

            {/* On a phone the first Timepiece has the full width and the
                other two share the row beneath it. */}
            <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:mt-14 md:grid-cols-3 md:gap-x-8">
              {timepieces
                .filter((timepiece) => timepiece.collection === collection.slug)
                .map((timepiece) => (
                  <li
                    key={timepiece.slug}
                    className="max-md:first:col-span-2"
                  >
                    <TimepieceCard
                      timepiece={timepiece}
                      sizes="(min-width: 48rem) 33vw, 100vw"
                    />
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
