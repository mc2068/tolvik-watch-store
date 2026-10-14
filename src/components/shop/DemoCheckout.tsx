"use client";

import { useRouter } from "next/navigation";
import { type Ref, useEffect, useId, useRef, useState } from "react";

import { OrderReview } from "@/components/shop/OrderReview";
import { ShippingForm } from "@/components/shop/ShippingForm";
import { ActionLink } from "@/components/ui/ActionLink";
import {
  emptyShipping,
  inventOrderNumber,
  type Shipping,
} from "@/lib/demo-checkout";
import { useCart, useCartRestored } from "@/store/cart";
import {
  type CartCatalogue,
  type PricedCart,
  priceCart,
} from "@/store/cart-lines";

/** The Demo Checkout's three steps, in order, named as the Shopper reads them. */
const steps = {
  shipping: "Shipping",
  payment: "Payment",
  confirmation: "Confirmation",
} as const;

type Step = keyof typeof steps;

/** The steps before the order is placed, which the Shopper moves between. */
type StepBeforeOrder = Exclude<Step, "confirmation">;

/** An order as the confirmation shows it. It is kept nowhere else. */
type Order = {
  number: string;
  shipping: Shipping;
  cart: PricedCart;
};

/**
 * The Demo Checkout: the Shopper's cart taken through shipping, a payment
 * step that takes no payment, and a confirmation with an invented order
 * number. It is one page whose steps follow one another in place, so that
 * what the Shopper types lives in this component's state and nowhere else:
 * not in the address, not in the browser's storage, not on any server.
 * Leaving the page, or reloading it, forgets it.
 *
 * Like the cart, it is handed the Catalogue's Timepieces and Colourways to
 * name and price the lines from.
 */
export function DemoCheckout(catalogue: CartCatalogue) {
  // Next keeps the last few pages the Shopper has left, hidden, with their
  // state, so that Back can show one again just as it was. (It does so with
  // React's `<Activity>`, which hides a part of the page without taking it
  // down.) Here that would bring back an address typed on the last visit,
  // or the last order's confirmation in place of a new checkout. So each
  // visit is a checkout of its own: hiding the page runs the cleanup of its
  // effects, which counts a new visit, and a new `key` has React build the
  // checkout again from nothing, ready for the Shopper's return.
  const [visit, setVisit] = useState(0);
  useEffect(() => () => setVisit((last) => last + 1), []);

  return <Checkout key={visit} {...catalogue} />;
}

function Checkout(catalogue: CartCatalogue) {
  const router = useRouter();
  const restored = useCartRestored();
  const lines = useCart((cart) => cart.lines);
  const openCart = useCart((cart) => cart.open);
  const clearCart = useCart((cart) => cart.clear);

  const [step, setStep] = useState<StepBeforeOrder>("shipping");
  const [shipping, setShipping] = useState<Shipping>(emptyShipping);
  const [order, setOrder] = useState<Order>();

  const priced = priceCart(lines, catalogue);
  const nothingToOrder = restored && !order && priced.count === 0;

  // With nothing in the cart there is nothing to check out, so the Shopper
  // is sent to choose something. `replace` takes the checkout out of the
  // browser's history, so Back does not bring them here again. Placing the
  // order empties the cart too, but by then there is an order to show.
  useEffect(() => {
    if (nothingToOrder) router.replace("/collection");
  }, [nothingToOrder, router]);

  // Each step opens on its heading, and the keyboard is taken there as the
  // step changes, so that a screen reader says where the Shopper now is.
  // Not on arriving at the page, which starts where any page starts.
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step, order]);

  const goTo = (next: StepBeforeOrder) => {
    moved.current = true;
    setStep(next);
  };

  const place = () => {
    moved.current = true;
    setOrder({ number: inventOrderNumber(), shipping, cart: priced });
    clearCart();
    window.scrollTo({ top: 0 });
  };

  if (order) {
    return <Confirmation order={order} headingRef={heading} />;
  }

  return (
    <>
      <CheckoutHeader title="Checkout" step={step} />

      {/* Until the cart is back from the browser's storage, or while an
          empty one is being sent away, there is nothing to show yet. */}
      {restored && !nothingToOrder && (
        // On a phone what is ordered comes first and the step under it. On
        // a laptop the step has the left half and the order stands to its
        // right, held in view while the step scrolls.
        <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-4 lg:col-start-9 lg:row-start-1">
            <div className="lg:sticky lg:top-header lg:pt-8">
              <OrderReview cart={priced} onChange={openCart} />
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:pt-8">
            {step === "shipping" ? (
              <ShippingForm
                initial={shipping}
                headingRef={heading}
                onDone={(filled) => {
                  setShipping(filled);
                  goTo("payment");
                }}
              />
            ) : (
              <Payment
                shipping={shipping}
                headingRef={heading}
                onChangeShipping={() => goTo("shipping")}
                onPlace={place}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The top of the page at each step: its heading, and the three steps of
 * the Demo Checkout in words, with the one the Shopper is on marked.
 */
function CheckoutHeader({
  title,
  step,
  headingRef,
}: {
  title: string;
  step: Step;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <header className="pt-10 pb-12 md:pt-14 md:pb-16">
      <h1
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className="max-w-statement font-display text-display text-balance"
      >
        {title}
      </h1>
      <ol
        aria-label="Steps"
        className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-small tracking-open md:mt-10"
      >
        {Object.entries(steps).map(([each, name]) => {
          const current = each === step;
          return (
            <li
              key={each}
              aria-current={current ? "step" : undefined}
              className={
                current
                  ? "border-b border-steel pb-1 text-platinum"
                  : "pb-1 text-platinum-dim"
              }
            >
              {name}
            </li>
          );
        })}
      </ol>
    </header>
  );
}

/**
 * The payment step, which takes no payment. It says so plainly, and asks
 * for no card: there is not one field on it for a Shopper to type a real
 * card number into.
 */
function Payment({
  shipping,
  headingRef,
  onChangeShipping,
  onPlace,
}: {
  shipping: Shipping;
  headingRef: Ref<HTMLHeadingElement>;
  onChangeShipping: () => void;
  onPlace: () => void;
}) {
  const id = useId();

  return (
    <section aria-labelledby={id}>
      <h2
        ref={headingRef}
        id={id}
        tabIndex={-1}
        className="font-display text-title"
      >
        Payment
      </h2>

      <div className="mt-8 border border-platinum-dim px-6 py-7 md:px-8">
        <p className="font-display text-title">Demo, no payment taken</p>
        <p className="mt-3 max-w-measure text-platinum-dim">
          Tolvik is an invented brand, so there is nothing to pay and no card to
          ask for. Placing the order shows the confirmation a Shopper would see.
        </p>
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <div className="flex items-baseline justify-between gap-x-4">
          <h3 className="text-small tracking-open text-platinum-dim">
            Ships to
          </h3>
          <button
            type="button"
            onClick={onChangeShipping}
            className="text-link -my-3 py-3 text-small"
          >
            Change<span className="sr-only"> the shipping address</span>
          </button>
        </div>
        <ShipsTo shipping={shipping} className="mt-3" />
      </div>

      <button
        type="button"
        onClick={onPlace}
        className="action-solid mt-10 max-md:w-full"
      >
        Place order
      </button>
    </section>
  );
}

/** Where an order goes, set out as an address is on an envelope. */
function ShipsTo({
  shipping: { name, email, address, city, postcode, country },
  className = "",
}: {
  shipping: Shipping;
  className?: string;
}) {
  return (
    <div className={className}>
      <address className="not-italic">
        {name}
        <br />
        {address}
        <br />
        {postcode} {city}
        <br />
        {country}
      </address>
      <p className="mt-2 text-platinum-dim">{email}</p>
    </div>
  );
}

/**
 * The end of the Demo Checkout: the order placed, its invented number, where
 * it would go and what is in it. The cart is already empty. Nothing here is
 * kept, so it lasts as long as the page does.
 */
function Confirmation({
  order: { number, shipping, cart },
  headingRef,
}: {
  order: Order;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const [firstName] = shipping.name.split(/\s+/);

  return (
    <>
      <CheckoutHeader
        title={`Thank you, ${firstName}.`}
        step="confirmation"
        headingRef={headingRef}
      />

      <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-6">
          <p className="max-w-measure text-lead text-platinum-dim">
            Your order is placed. Tolvik is a concept, so nothing was charged,
            and nothing you typed has left this page.
          </p>

          <dl className="mt-10 grid gap-y-6 border-t border-line pt-6 md:grid-cols-2 md:gap-x-8">
            <div>
              <dt className="text-small tracking-open text-platinum-dim">
                Order number
              </dt>
              <dd className="mt-1 font-display text-title tabular-nums">
                {number}
              </dd>
            </div>
            <div>
              <dt className="text-small tracking-open text-platinum-dim">
                Ships to
              </dt>
              <dd className="mt-1">
                <ShipsTo shipping={shipping} />
              </dd>
            </div>
          </dl>

          <ActionLink href="/collection" className="mt-10">
            View the Collection
          </ActionLink>
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <OrderReview cart={cart} />
        </div>
      </div>
    </>
  );
}
