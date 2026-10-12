import Link from "next/link";

import { MainNavigation } from "@/components/ui/MainNavigation";
import { Wordmark } from "@/components/ui/Wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-(--layer-header) border-b border-line bg-ink">
      <div className="page-frame flex h-header items-center justify-between">
        <Link href="/" className="text-platinum">
          <Wordmark />
        </Link>

        <MainNavigation />
      </div>
    </header>
  );
}
