import type { ReactNode } from "react";

/**
 * What an address with nothing at it shows: one statement, filling the
 * screen, and under it a line that ends in the way back.
 */
export function NotFoundMessage({
  statement,
  children,
}: {
  statement: string;
  /** The line under the statement, with its link. */
  children: ReactNode;
}) {
  return (
    <main className="page-frame flex min-h-viewport flex-col justify-center py-section">
      <h1 className="max-w-statement font-display text-display text-balance">
        {statement}
      </h1>
      <p className="mt-8 max-w-measure text-lead text-platinum-dim md:mt-10">
        {children}
      </p>
    </main>
  );
}
