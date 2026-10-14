import type { Metadata } from "next";

import { DemoCheckout } from "@/components/shop/DemoCheckout";
import { listColourways, listTimepieces } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "The Demo Checkout: shipping, a payment step that takes no payment, and a confirmation.",
};

// The page itself is the same for every Shopper: the cart it checks out is
// in their browser, so the checkout is drawn there, from the Catalogue's
// Timepieces and Colourways that the server hands it here.
export default async function CheckoutPage() {
  const [timepieces, colourways] = await Promise.all([
    listTimepieces(),
    listColourways(),
  ]);

  return (
    <main className="page-frame min-h-viewport pb-section">
      <DemoCheckout timepieces={timepieces} colourways={colourways} />
    </main>
  );
}
