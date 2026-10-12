import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-frame flex min-h-viewport flex-col justify-center py-section">
      <h1 className="max-w-statement font-display text-display text-balance">
        This page does not exist.
      </h1>
      <p className="mt-8 max-w-measure text-lead text-platinum-dim md:mt-10">
        The address may be mistyped, or the page may have moved.{" "}
        <Link href="/" className="text-link">
          Return Home
        </Link>
      </p>
    </main>
  );
}
