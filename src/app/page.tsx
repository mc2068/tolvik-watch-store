import { Craftsmanship } from "@/components/home/Craftsmanship";
import { HeroActs } from "@/components/home/HeroActs";

// The Hero Timepiece's price and the address of its page, set here until
// the Catalogue exists to be asked for them.
const heroTimepiece = { price: 6400, href: "/collection" };

export default function Home() {
  return (
    <main>
      <HeroActs heroTimepiece={heroTimepiece} />
      <Craftsmanship />
    </main>
  );
}
