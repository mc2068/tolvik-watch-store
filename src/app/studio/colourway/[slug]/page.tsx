import { notFound } from "next/navigation";

import { HeroActs } from "@/components/home/HeroActs";
import { getHeroTimepiece, listColourways } from "@/lib/catalogue";

// The studio's other room: Home's 3D acts played by the Hero Timepiece in
// each of its Colourways, for `npm run stills` to photograph. Like the
// studio beside it, it is open only in the build that script makes.
const studioOpen = process.env.TOLVIK_STUDIO === "1";

export async function generateStaticParams() {
  return (await listColourways()).map(({ slug }) => ({ slug }));
}

export default async function ColourwayStudio({
  params,
}: PageProps<"/studio/colourway/[slug]">) {
  const { slug } = await params;
  const colourway = studioOpen
    ? (await listColourways()).find((colourway) => colourway.slug === slug)
    : undefined;
  if (!colourway) notFound();

  const hero = await getHeroTimepiece();

  return (
    <main>
      <HeroActs
        timepiece={{
          ...hero,
          finish: colourway.finish,
          stills: [colourway.still],
        }}
      />
    </main>
  );
}
