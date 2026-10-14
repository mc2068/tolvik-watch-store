import type { Metadata } from "next";
import { Schibsted_Grotesk, Spectral } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { site } from "@/lib/site";

// Both faces are free (SIL Open Font Licence). next/font downloads them at
// build time and serves them from this site, so no Shopper's browser ever
// calls Google. Each is exposed as a CSS variable that globals.css names.
const display = Spectral({
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-spectral",
});

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-schibsted",
});

// A page that sets its own title has the site's name added after it.
//
// The rest is what a link shows where it is shared. Open Graph is the set of
// tags most sites read for that, and X reads its own `twitter` ones. Neither
// is given a title or description here, so Next fills both in from each
// page's own. Their image is `opengraph-image.jpg` beside this file, which
// Next offers for every page under it.
//
// A shared link needs the image's full address, so `metadataBase` names the
// address the site is deployed at, which Vercel gives the build, and a build
// anywhere else this machine's. Vercel sets the production address on a
// preview deployment too, but Next gives an image made by its file
// convention, as this one is, the preview's own address there.
const deployedAt = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(
    deployedAt ? `https://${deployedAt}` : "http://localhost:3000",
  ),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
