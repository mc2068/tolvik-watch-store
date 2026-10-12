import { Craftsmanship } from "@/components/home/Craftsmanship";
import { HeroActs } from "@/components/home/HeroActs";
import { PrototypeSwitcher } from "@/components/ui/PrototypeSwitcher";

// The Hero Timepiece's price and where its call to action leads, set here
// until the Catalogue exists to be asked. The Timepiece has no page of its
// own yet, so the call to action leads to the Collection.
const heroTimepiece = { price: 6400, href: "/collection" };

export default function Home() {
  return (
    <main>
      <HeroActs heroTimepiece={heroTimepiece} />
      <Craftsmanship />
      {/* PROTOTYPE: flips between the Exploded View variants. */}
      <PrototypeSwitcher />
    </main>
  );
}
