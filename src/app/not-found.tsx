import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-var(--spacing-header))] max-w-page flex-col justify-center px-gutter py-section">
      <h1 className="max-w-[15ch] font-display text-display text-balance">
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
