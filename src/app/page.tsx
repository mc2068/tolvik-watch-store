import { Close } from "@/components/home/Close";
import { CollectionSection } from "@/components/home/CollectionSection";
import { Craftsmanship } from "@/components/home/Craftsmanship";
import { HeroActs } from "@/components/home/HeroActs";
import { getHeroTimepiece } from "@/lib/catalogue";

export default async function Home() {
  const heroTimepiece = await getHeroTimepiece();

  return (
    <main>
      <HeroActs timepiece={heroTimepiece} />
      <CollectionSection />
      <Craftsmanship />
      <Close />
    </main>
  );
}
