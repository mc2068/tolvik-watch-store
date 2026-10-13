import Link from "next/link";

import { NotFoundMessage } from "@/components/ui/NotFoundMessage";

// What an address under `/collection` shows when Tolvik makes no Timepiece
// by that name. A `not-found.tsx` answers for its own folder; anywhere else
// on the site the one in `src/app` does.
export default function TimepieceNotFound() {
  return (
    <NotFoundMessage statement="Tolvik makes no such Timepiece.">
      The address may be mistyped, or the Timepiece may no longer be made.{" "}
      <Link href="/collection" className="text-link">
        Return to the Collection
      </Link>
    </NotFoundMessage>
  );
}
