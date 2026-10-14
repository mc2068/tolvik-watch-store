import { ActionLink } from "@/components/ui/ActionLink";

/**
 * Home's last word: who Tolvik is, in a few lines, and the one thing to do
 * next. It answers the headline the page opens on, and stands a full screen
 * tall, centred and alone, so the page ends here and not in the footer.
 */
export function Close() {
  return (
    <section aria-labelledby="close-heading">
      <div className="page-frame flex min-h-viewport flex-col items-center justify-center py-section text-center">
        {/* The doubled baton that marks twelve on every Tolvik dial. */}
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-10 w-0.5 bg-steel" />
          <span className="h-10 w-0.5 bg-steel" />
        </span>

        <h2
          id="close-heading"
          className="mt-10 max-w-statement font-display text-display text-balance md:mt-12"
        >
          Your hour, in steel.
        </h2>
        <p className="mt-8 max-w-measure text-lead text-pretty text-platinum-dim md:mt-10">
          Tolvik is a small workshop in the north. It makes one steel case and
          changes only what a wearer will notice: the colour of the dial and
          the finish of the steel. Every watch is built to be worn daily and
          serviced for as long as it is kept.
        </p>
        <ActionLink href="/collection" className="mt-10 md:mt-12">
          View the Collection
        </ActionLink>
      </div>
    </section>
  );
}
