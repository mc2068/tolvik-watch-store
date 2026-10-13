import Link from "next/link";

// What an address under `/collection` shows when Tolvik makes no Timepiece
// by that name. A `not-found.tsx` answers for its own folder; anywhere else
// on the site the one in `src/app` does.
export default function TimepieceNotFound() {
  return (
    <main className="page-frame flex min-h-viewport flex-col justify-center py-section">
      <h1 className="max-w-statement font-display text-display text-balance">
        Tolvik makes no such Timepiece.
      </h1>
      <p className="mt-8 max-w-measure text-lead text-platinum-dim md:mt-10">
        The address may be mistyped, or the Timepiece may no longer be
        made.{" "}
        <Link href="/collection" className="text-link">
          Return to the Collection
        </Link>
      </p>
    </main>
  );
}
