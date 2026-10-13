import { notFound } from "next/navigation";

import { HeroActs } from "@/components/home/HeroActs";
import { getTimepiece, listTimepieces } from "@/lib/catalogue";

// The studio: Home's 3D acts played by any Timepiece, in its own Finish. It
// is where `npm run stills` photographs the Stills, and it is open only in
// the build that script makes. In every other build, the deployed site
// included, each address here answers that the page does not exist.
const studioOpen = process.env.TOLVIK_STUDIO === "1";

// `generateStaticParams` tells Next which addresses this page has, so each
// one is rendered once, at build time.
export async function generateStaticParams() {
  return (await listTimepieces()).map(({ slug }) => ({ slug }));
}

export default async function Studio({ params }: PageProps<"/studio/[slug]">) {
  const { slug } = await params;
  const timepiece = studioOpen ? await getTimepiece(slug) : undefined;
  if (!timepiece) notFound();

  return (
    <main>
      <HeroActs timepiece={timepiece} href="/collection" />
    </main>
  );
}
