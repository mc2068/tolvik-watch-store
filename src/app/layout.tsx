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
export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
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
