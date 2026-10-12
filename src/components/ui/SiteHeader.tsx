import Link from "next/link";

import { MainNavigation } from "@/components/ui/MainNavigation";
import { Wordmark } from "@/components/ui/Wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-(--layer-header) border-b border-line bg-ink">
      <div className="mx-auto flex h-header max-w-page items-center justify-between px-gutter">
        <Link href="/" className="text-platinum">
          <Wordmark />
        </Link>

        <MainNavigation />
      </div>
    </header>
  );
}
