import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ColourwayChoice } from "@/components/shop/ColourwayChoice";
import { ColourwayPicker } from "@/components/shop/ColourwayPicker";
import { StillFrame } from "@/components/shop/StillFrame";
import { TimepieceInColourway } from "@/components/shop/TimepieceInColourway";
import {
  getCollection,
  getDefaultColourway,
  getTimepiece,
  listColourways,
  listTimepieces,
} from "@/lib/catalogue";
import { formatPrice } from "@/lib/price";
import { collectionPath } from "@/lib/site";
import { groupSpecifications } from "@/lib/specifications";

// A folder named in square brackets is a dynamic route: one page file that
// answers at every address of its shape, here `/collection/tjern` and the
// like, and is handed the part in the brackets as `params`.
//
// `generateStaticParams` tells Next which addresses there are, so each
// Timepiece's page is rendered once, at build time, and served as a file.
export async function generateStaticParams() {
  return (await listTimepieces()).map(({ slug }) => ({ slug }));
}

// An address not in that list is rendered when it is first asked for. Next
// would by default answer it at once with an empty shell and send the page
// after, by which time it has already said the address exists. Everything
// on this page is known up front, so it asks for the whole page before any
// answer: an address with no Timepiece is then a true 404.
export const ensureStatic = "navigation";

// `generateMetadata` is how a page whose title depends on its address sets
// it. The root layout adds the site's name after the title.
export async function generateMetadata({
  params,
}: PageProps<"/collection/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const timepiece = await getTimepiece(slug);
  if (!timepiece) return { title: "No such Timepiece" };

  return { title: timepiece.name, description: timepiece.description };
}

export default async function TimepiecePage({
  params,
}: PageProps<"/collection/[slug]">) {
  const { slug } = await params;
  const timepiece = await getTimepiece(slug);
  // `notFound` stops here and shows `not-found.tsx` from this folder.
  if (!timepiece) notFound();

  const collection = await getCollection(timepiece.collection);
  const [front, ...otherStills] = timepiece.stills;

  const copy = (
    <>
      <h1 className="font-display text-display">{timepiece.name}</h1>
      <p className="mt-4 font-display text-title md:mt-6">
        {formatPrice(timepiece.price)}
      </p>
      <p className="mt-6 max-w-measure text-lead text-platinum-dim md:mt-8">
        {timepiece.description}
      </p>
    </>
  );

  return (
    <main className="page-frame pb-section">
      <nav aria-label="Breadcrumb" className="pt-8 pb-6 md:pt-10 md:pb-8">
        <ol className="flex gap-x-3 text-small tracking-open text-platinum-dim">
          <li>
            <Link href="/collection" className="text-link">
              The Collection
            </Link>
          </li>
          {collection && (
            <li className="flex gap-x-3">
              <span aria-hidden="true">/</span>
              <Link
                href={collectionPath(collection.slug)}
                className="text-link"
              >
                {collection.name}
              </Link>
            </li>
          )}
        </ol>
      </nav>

      {/* On a phone the Timepiece is seen first and read about under it. On
          a laptop the page is set as Home's Stage is: the copy in the left
          two fifths, the watch in the right three. */}
      {timepiece.isHero ? (
        // The Hero Timepiece is here live, in place of its Stills, and the
        // Shopper chooses its Colourway. It is the frame that holds its
        // place, so the watch is in view while they choose. `ColourwayChoice`
        // keeps the choice for the two parts of the page that need it: the
        // picker, which sets it, and the watch, which is drawn in it.
        <ColourwayChoice
          colourways={await listColourways()}
          initial={(await getDefaultColourway()).slug}
        >
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
            <div className="watch-frame lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:self-start">
              <TimepieceInColourway />
            </div>

            <div className="max-lg:mt-8 lg:col-span-4 lg:col-start-1 lg:row-start-1 lg:pt-12">
              {copy}
              <div className="mt-8 border-t border-line pt-8 md:mt-10">
                <ColourwayPicker />
              </div>
            </div>
          </div>
        </ColourwayChoice>
      ) : (
        // Every other Timepiece is shown in its Stills, and the copy holds
        // its place while they scroll past it. From a tablet's width up the
        // first Still is shown square, the whole of what the camera took:
        // upright it would be taller than the screen.
        <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
            <StillFrame
              still={front}
              sizes="(min-width: 64rem) 55vw, 100vw"
              first
              className="md:aspect-square"
            />
          </div>

          <div className="lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-header lg:pt-12">{copy}</div>
          </div>

          <ul className="grid grid-cols-2 gap-x-5 lg:col-span-7 lg:col-start-6 lg:row-start-2 lg:gap-x-8">
            {otherStills.map((still) => (
              <li key={still.view}>
                <StillFrame
                  still={still}
                  sizes="(min-width: 64rem) 28vw, 50vw"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seven specifications in three short groups, each a list of its
          own, so a Shopper looks for the group first and reads two or
          three lines, not seven. The groups stand under the Stills. */}
      <section
        aria-labelledby="specifications-heading"
        className="mt-section grid gap-y-10 border-t border-line pt-10 md:pt-14 lg:grid-cols-12 lg:gap-x-8"
      >
        <h2
          id="specifications-heading"
          className="font-display text-title lg:col-span-4"
        >
          Specifications
        </h2>
        <div className="grid gap-x-8 gap-y-10 md:grid-cols-3 lg:col-span-7 lg:col-start-6">
          {groupSpecifications(timepiece.specifications).map((group, index) => (
            <div
              key={group.name}
              role="group"
              aria-labelledby={`specifications-group-${index}`}
            >
              <h3
                id={`specifications-group-${index}`}
                className="font-display text-lead"
              >
                {group.name}
              </h3>
              <dl className="mt-5 grid gap-y-5">
                {group.entries.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-small tracking-open text-platinum-dim">
                      {label}
                    </dt>
                    <dd className="mt-1">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
