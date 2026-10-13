import { CollectionSection } from "@/components/home/CollectionSection";
import { Craftsmanship } from "@/components/home/Craftsmanship";
import { HeroActs } from "@/components/home/HeroActs";
import { getHeroTimepiece } from "@/lib/catalogue";

export default async function Home() {
  const heroTimepiece = await getHeroTimepiece();

  return (
    <main>
      {/* The Hero Timepiece has no page of its own yet, so the call to action
          leads to the Collection. */}
      <HeroActs timepiece={heroTimepiece} href="/collection" />
      <CollectionSection />
      <Craftsmanship />
    </main>
  );
}
