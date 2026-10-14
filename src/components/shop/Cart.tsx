"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { StillFrame } from "@/components/shop/StillFrame";
import { ActionLink } from "@/components/ui/ActionLink";
import { formatPrice } from "@/lib/price";
import { timepiecePath } from "@/lib/site";
import { useCart } from "@/store/cart";
import {
  type CartCatalogue,
  lineKey,
  MOST_OF_ONE,
  priceCart,
  type PricedLine,
} from "@/store/cart-lines";

/**
 * The Shopper's cart, in the two places it is seen: its button in the
 * header, which says how many Timepieces it holds, and the cart itself, a
 * panel that slides out over the page from the right.
 *
 * The cart holds slugs and quantities and nothing else, so it is handed the
 * Catalogue's Timepieces and Colourways to name and price its lines from.
 */
export function Cart(catalogue: CartCatalogue) {
  const lines = useCart((cart) => cart.lines);
  const isOpen = useCart((cart) => cart.isOpen);
  const open = useCart((cart) => cart.open);
  const close = useCart((cart) => cart.close);
  const remove = useCart((cart) => cart.remove);

  const panel = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const heading = useId();

  const priced = priceCart(lines, catalogue);

  // The panel is the browser's own `<dialog>`, opened as a modal. That is
  // what holds the keyboard inside it while it is open, closes it on Escape
  // and, when it closes, puts the keyboard back on whatever opened it. The
  // store says whether the cart is open; this keeps the dialog in step.
  useEffect(() => {
    const dialog = panel.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        // Shown as the number alone; read out as what the number counts.
        aria-label={`Cart, ${priced.count} ${priced.count === 1 ? "Timepiece" : "Timepieces"}`}
        onClick={open}
        className="-mr-3 h-11 px-3 text-small tracking-open whitespace-nowrap text-platinum transition-colors duration-(--duration-quick) ease-settle md:text-platinum-dim md:hover:text-platinum"
      >
        Cart
        <span className="ml-2 text-platinum tabular-nums">{priced.count}</span>
      </button>

      <dialog
        ref={panel}
        aria-labelledby={heading}
        className="cart-panel"
        // Escape closes the dialog without asking the store, so the store
        // is told here.
        onClose={close}
        // The panel's own content covers all of it, so a click that lands
        // on the dialog itself is one on the dimmed page beside it.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="flex h-header shrink-0 items-center justify-between border-b border-line px-6">
          <h2 id={heading} className="font-display text-lead">
            Your cart
          </h2>
          <button
            ref={closeButton}
            type="button"
            onClick={close}
            className="-mr-3 h-11 px-3 text-small tracking-open text-platinum-dim transition-colors duration-(--duration-quick) ease-settle hover:text-platinum"
          >
            Close
          </button>
        </div>

        {priced.lines.length === 0 ? (
          <div className="flex-1 px-6 py-10">
            <p className="font-display text-title">Nothing here yet.</p>
            <p className="mt-4 max-w-measure text-platinum-dim">
              Tolvik makes six Timepieces. Any of them can be added from its own
              page.
            </p>
            <ActionLink href="/collection" onClick={close} className="mt-8">
              View the Collection
            </ActionLink>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto overscroll-contain px-6">
              {priced.lines.map((line) => (
                <Line
                  key={lineKey(line.which)}
                  line={line}
                  onFollow={close}
                  onRemove={() => {
                    remove(line.which);
                    // The button that was pressed goes with its line, and
                    // the keyboard must not be left on nothing.
                    closeButton.current?.focus();
                  }}
                />
              ))}
            </ul>

            <div className="shrink-0 border-t border-line px-6 py-6">
              <p className="flex items-baseline justify-between gap-x-4">
                <span className="text-small tracking-open text-platinum-dim">
                  Total
                </span>
                <span className="font-display text-title">
                  {formatPrice(priced.total)}
                </span>
              </p>
              <Link
                href="/checkout"
                onClick={close}
                className="action-solid mt-6 w-full"
              >
                Check out
              </Link>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

/**
 * One line of the cart: the Timepiece's Still, its name, the Colourway it
 * was chosen in, what the line comes to, and the two things a Shopper can
 * do to it: change how many, and remove it.
 */
function Line({
  line: { which, timepiece, colourway, quantity, price },
  onFollow,
  onRemove,
}: {
  line: PricedLine;
  /** Called when the Shopper leaves the cart for the Timepiece's page. */
  onFollow: () => void;
  onRemove: () => void;
}) {
  const setQuantity = useCart((cart) => cart.setQuantity);

  return (
    <li className="flex gap-x-5 border-b border-line py-6 last:border-b-0">
      <div className="w-20 shrink-0">
        <StillFrame
          still={colourway?.still ?? timepiece.stills[0]}
          sizes="5rem"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-x-4">
          <h3 className="font-display text-lead">
            <Link
              href={timepiecePath(timepiece.slug)}
              onClick={onFollow}
              className="tap-target transition-colors duration-(--duration-quick) ease-settle hover:text-steel"
            >
              {timepiece.name}
            </Link>
          </h3>
          <p className="text-small tracking-open">{formatPrice(price)}</p>
        </div>
        {colourway && (
          <p className="mt-1 text-small text-platinum-dim">{colourway.name}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-x-4">
          <div
            role="group"
            aria-label="Quantity"
            className="flex items-center border border-line"
          >
            <Step
              name="One fewer"
              sign="−"
              atItsEnd={quantity === 1}
              onStep={() => setQuantity(which, quantity - 1)}
            />
            {/* An `output` is read out by a screen reader when it changes. */}
            <output className="w-6 text-center text-small tabular-nums">
              {quantity}
            </output>
            <Step
              name="One more"
              sign="+"
              atItsEnd={quantity === MOST_OF_ONE}
              onStep={() => setQuantity(which, quantity + 1)}
            />
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="tap-target text-link text-small"
          >
            Remove<span className="sr-only"> {timepiece.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * One of the two buttons either side of a line's quantity. One that has
 * nowhere left to go is marked so and does nothing, but stays a button the
 * keyboard can rest on: switched off outright, it would drop the keyboard's
 * place the moment the quantity reached its end.
 */
function Step({
  name,
  sign,
  atItsEnd,
  onStep,
}: {
  name: string;
  sign: string;
  /** Whether the quantity is already as far this way as it goes. */
  atItsEnd: boolean;
  onStep: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-disabled={atItsEnd}
      onClick={atItsEnd ? undefined : onStep}
      className="size-11 text-platinum transition-colors duration-(--duration-quick) ease-settle hover:text-steel aria-disabled:cursor-default aria-disabled:text-platinum-faint"
    >
      <span aria-hidden="true">{sign}</span>
    </button>
  );
}
