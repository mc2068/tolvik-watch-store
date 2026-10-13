import { TimepieceCard } from "@/components/shop/TimepieceCard";
import { ActionLink } from "@/components/ui/ActionLink";
import { listCollections, listTimepieces } from "@/lib/catalogue";

/**
 * Home's Collection section: a selection of the Timepieces and the way to
 * all of them. It follows the acts, so it shows what they have not: one
 * Timepiece from each Collection, passing over the Hero Timepiece.
 */
export async function CollectionSection() {
  const [collections, timepieces] = await Promise.all([
    listCollections(),
    listTimepieces(),
  ]);
  const selection = collections.flatMap((collection) => {
    const timepiece = timepieces.find(
      (candidate) =>
        candidate.collection === collection.slug && !candidate.isHero,
    );
    return timepiece ? [{ collection, timepiece }] : [];
  });

  return (
    <section aria-labelledby="collection-heading">
      <div className="page-frame grid gap-y-14 py-section lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <h2
            id="collection-heading"
            className="max-w-statement font-display text-display text-balance"
          >
            One watch, six ways.
          </h2>
          <p className="mt-8 max-w-measure text-lead text-platinum-dim md:mt-10">
            Every Tolvik is built on the case you have just seen apart. What
            changes is the steel, left brushed or blackened, and the colour of
            the dial.
          </p>
          <ActionLink href="/collection" className="mt-8 md:mt-10">
            View the Collection
          </ActionLink>
        </div>

        {/* The second Timepiece hangs lower than the first, so the pair
            reads as two watches set down and not as a grid. */}
        <ul className="grid grid-cols-2 items-start gap-x-5 lg:col-span-7 lg:gap-x-8">
          {selection.map(({ collection, timepiece }) => (
            <li key={timepiece.slug} className="even:mt-16 lg:even:mt-28">
              <TimepieceCard
                timepiece={timepiece}
                sizes="(min-width: 64rem) 28vw, 50vw"
                note={`From the ${collection.name} Collection`}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
