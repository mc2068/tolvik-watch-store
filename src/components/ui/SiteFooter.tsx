import Link from "next/link";

import { SiteCredit } from "@/components/ui/SiteCredit";
import { Wordmark } from "@/components/ui/Wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="page-frame grid gap-10 py-14 text-small text-platinum-dim md:grid-cols-2 md:items-end md:py-16">
        <div className="grid gap-5">
          <Wordmark />
          <p className="max-w-measure">
            Tolvik is an invented watch brand. Nothing here is for sale.
          </p>
        </div>

        <div className="grid gap-1 md:justify-items-end md:text-right">
          <p>
            <SiteCredit />
          </p>
          <p>
            All rights reserved.{" "}
            <Link href="/credits" className="text-link">
              Credits
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
