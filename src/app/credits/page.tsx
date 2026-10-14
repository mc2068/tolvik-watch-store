import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteCredit } from "@/components/ui/SiteCredit";
import { creditLine, modelCredits } from "@/lib/credits";

export const metadata: Metadata = {
  title: "Credits",
  description:
    "Tolvik is a fictional brand. The artists whose 3D models the site is built on, and who made it.",
};

export default function CreditsPage() {
  return (
    <main className="page-frame pb-section">
      <header className="pt-section pb-16 md:pb-24">
        <h1 className="max-w-statement font-display text-display text-balance">
          Credits
        </h1>
        <p className="mt-8 max-w-measure text-lead text-pretty text-platinum-dim md:mt-10">
          Tolvik is a fictional brand, invented for this site. Nothing here is
          for sale: the checkout takes no payment, and every name, price,
          specification and line of history is made up.
        </p>
      </header>

      <div className="grid gap-y-section">
        <CreditsSection id="models" heading="The 3D models">
          <p>
            Both are free to use under the Creative Commons Attribution 4.0
            licence, which asks that their artists be credited wherever the
            work is shown.
          </p>
          <ul className="mt-10 grid gap-y-12 md:mt-14">
            {modelCredits.map((credit) => (
              <li key={credit.source} className="grid gap-y-3">
                <h3 className="font-display text-title">
                  <a href={credit.source} className="text-link">
                    {credit.title}
                  </a>
                </h3>
                <p className="text-platinum">
                  By{" "}
                  <a href={credit.authorUrl} className="text-link">
                    {credit.author}
                  </a>
                  , licensed under{" "}
                  <a href={credit.licenceUrl} className="text-link">
                    {credit.licence}
                  </a>
                  .
                </p>
                <p>{credit.changes}</p>
                {/* The sentence the model's licence file asks be copied
                    wherever it is shared, word for word. */}
                <p className="text-small break-words text-platinum-faint">
                  {creditLine(credit)}
                </p>
              </li>
            ))}
          </ul>
        </CreditsSection>

        <CreditsSection id="type" heading="Type">
          <p>
            Set in Spectral and Schibsted Grotesk, both free under the SIL Open
            Font Licence.
          </p>
        </CreditsSection>

        <CreditsSection id="site" heading="This site">
          <p>
            <SiteCredit />. All rights reserved. The 3D models remain under their own
            licences.
          </p>
        </CreditsSection>
      </div>
    </main>
  );
}

/** One part of the credits: a heading beside what it credits. */
function CreditsSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="grid gap-y-6 border-t border-line pt-10 md:grid-cols-12 md:gap-x-8 md:pt-14"
    >
      <h2 id={`${id}-heading`} className="font-display text-title md:col-span-5">
        {heading}
      </h2>
      <div className="max-w-measure text-platinum-dim md:col-span-7 md:pt-2">
        {children}
      </div>
    </section>
  );
}
