import Link from "next/link";

import { Cart } from "@/components/shop/Cart";
import { MainNavigation } from "@/components/ui/MainNavigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { listColourways, listTimepieces } from "@/lib/catalogue";

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-(--layer-header) border-b border-line bg-ink">
      <div className="page-frame flex h-header items-center justify-between">
        <Link href="/" className="flex h-11 items-center text-platinum">
          <Wordmark />
        </Link>

        {/* The cart's button has padding to make it easy to hit, which
            the gap beside it allows for. */}
        <div className="flex items-center gap-x-1 md:gap-x-7">
          <MainNavigation />
          <Cart
            timepieces={await listTimepieces()}
            colourways={await listColourways()}
          />
        </div>
      </div>
    </header>
  );
}
