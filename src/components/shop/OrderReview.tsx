import { useId } from "react";

import { StillFrame } from "@/components/shop/StillFrame";
import { formatPrice } from "@/lib/price";
import { lineKey, type PricedCart } from "@/store/cart-lines";

/**
 * What the Shopper is ordering, as the Demo Checkout shows it beside each
 * step: every line with its Still, its Colourway and how many, and the
 * total. It is only read here; the cart is where it is changed, which
 * `onChange`, where it is given, opens.
 */
export function OrderReview({
  cart: { lines, total },
  onChange,
}: {
  cart: PricedCart;
  /** Opens the cart to change what is in it, until the order is placed. */
  onChange?: () => void;
}) {
  const heading = useId();

  return (
    <section aria-labelledby={heading} className="border-t border-line pt-6">
      <div className="flex items-baseline justify-between gap-x-4">
        <h2 id={heading} className="font-display text-lead">
          Your order
        </h2>
        {onChange && (
          <button
            type="button"
            onClick={onChange}
            className="text-link text-small"
          >
            Change<span className="sr-only"> what is in the cart</span>
          </button>
        )}
      </div>

      <ul className="mt-2">
        {lines.map(({ which, timepiece, colourway, quantity, price }) => (
          <li
            key={lineKey(which)}
            className="flex gap-x-4 border-b border-line py-5"
          >
            <div className="w-16 shrink-0">
              <StillFrame
                still={colourway?.still ?? timepiece.stills[0]}
                sizes="4rem"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-x-4">
                <h3 className="font-display text-lead">{timepiece.name}</h3>
                <p className="text-small tracking-open">{formatPrice(price)}</p>
              </div>
              {colourway && (
                <p className="mt-1 text-small text-platinum-dim">
                  {colourway.name}
                </p>
              )}
              <p className="mt-1 text-small text-platinum-dim">
                Quantity {quantity}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="flex items-baseline justify-between gap-x-4 pt-5">
        <span className="text-small tracking-open text-platinum-dim">
          Total
        </span>
        <span className="font-display text-title">{formatPrice(total)}</span>
      </p>
      <p className="mt-1 text-small text-platinum-dim">
        Insured shipping is included.
      </p>
    </section>
  );
}
