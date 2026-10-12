import { Wordmark } from "@/components/ui/Wordmark";
import { site } from "@/lib/site";

export function SiteFooter() {
  const { credit } = site;

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
            {credit.lead}{" "}
            <a href={credit.href} className="text-link">
              {credit.name}
            </a>
          </p>
          <p>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
