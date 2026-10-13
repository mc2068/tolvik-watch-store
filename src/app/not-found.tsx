import Link from "next/link";

import { NotFoundMessage } from "@/components/ui/NotFoundMessage";

export default function NotFound() {
  return (
    <NotFoundMessage statement="This page does not exist.">
      The address may be mistyped, or the page may have moved.{" "}
      <Link href="/" className="text-link">
        Return Home
      </Link>
    </NotFoundMessage>
  );
}
