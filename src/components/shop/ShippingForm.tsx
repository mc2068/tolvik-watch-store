"use client";

import {
  type FormEvent,
  type HTMLInputTypeAttribute,
  type Ref,
  useId,
  useRef,
  useState,
} from "react";

import {
  checkShipping,
  settleShipping,
  type Shipping,
} from "@/lib/demo-checkout";

type Field = {
  name: keyof Shipping;
  label: string;
  type?: HTMLInputTypeAttribute;
  /** Whether it shares a row with its neighbour, where there is room. */
  half?: boolean;
};

const fields: Field[] = [
  { name: "name", label: "Full name" },
  { name: "email", label: "Email", type: "email" },
  { name: "address", label: "Street address" },
  { name: "city", label: "Town or city", half: true },
  { name: "postcode", label: "Postal code", half: true },
  { name: "country", label: "Country" },
];

/**
 * The first step of the Demo Checkout: where the order would be sent. What
 * the Shopper types is held here, in this component's state, and handed on
 * only once every field is filled in well. It is never sent, logged or
 * stored.
 *
 * Nothing is called wrong until the Shopper first tries to go on. From then
 * each field is checked as it changes, so one put right says so at once.
 */
export function ShippingForm({
  initial,
  onDone,
  headingRef,
}: {
  initial: Shipping;
  onDone: (shipping: Shipping) => void;
  /** The step's heading, which the checkout brings the keyboard to. */
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const [shipping, setShipping] = useState(initial);
  const [tried, setTried] = useState(false);
  const inputs = useRef(new Map<keyof Shipping, HTMLInputElement>());
  const id = useId();

  const problems = tried ? checkShipping(shipping) : {};

  // The form is the browser's own, so Enter in any field tries to go on.
  // `preventDefault` stops the browser sending the form anywhere: nothing
  // here has anywhere to go. The inputs have no `name` either, so even a
  // form sent by the browser would carry none of them.
  const continueToPayment = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);

    const found = checkShipping(shipping);
    const first = fields.find(({ name }) => found[name]);
    if (first) {
      inputs.current.get(first.name)?.focus();
      return;
    }

    onDone(settleShipping(shipping));
  };

  return (
    // `noValidate` turns off the browser's own bubbles, which would say the
    // same things in another voice; the messages under the fields say them.
    // `autoComplete="off"`, on the form and on each field, asks the browser
    // not to fill them from what it knows of the Shopper, nor to offer to
    // keep what is typed for next time: the address is never stored, not
    // even by the browser. It is a request, which browsers mostly honour.
    <form
      noValidate
      autoComplete="off"
      aria-labelledby={`${id}-heading`}
      onSubmit={continueToPayment}
    >
      <h2
        ref={headingRef}
        id={`${id}-heading`}
        tabIndex={-1}
        className="font-display text-title"
      >
        Shipping
      </h2>
      <p className="mt-4 max-w-measure text-platinum-dim">
        Any name and address will do. What you type stays on this page, and is
        gone once you leave it.
      </p>

      <div className="mt-10 grid gap-x-5 gap-y-7 md:grid-cols-2">
        {fields.map(({ name, label, type = "text", half }) => {
          const problem = problems[name];
          const fieldId = `${id}-${name}`;

          return (
            <div
              key={name}
              className={`grid content-start gap-2 ${half ? "" : "md:col-span-2"}`}
            >
              <label
                htmlFor={fieldId}
                className="text-small tracking-open text-platinum-dim"
              >
                {label}
              </label>
              <input
                // Each input is kept by its field, to bring the keyboard to
                // it; the function it returns lets it go again.
                ref={(input) => {
                  if (!input) return;
                  inputs.current.set(name, input);
                  return () => {
                    inputs.current.delete(name);
                  };
                }}
                id={fieldId}
                type={type}
                autoComplete="off"
                spellCheck={false}
                value={shipping[name]}
                onChange={({ target: { value } }) =>
                  setShipping((was) => ({ ...was, [name]: value }))
                }
                aria-invalid={problem ? true : undefined}
                aria-describedby={problem ? `${fieldId}-problem` : undefined}
                className="field"
              />
              {problem && (
                <p id={`${fieldId}-problem`} className="text-small text-alert">
                  {problem}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button type="submit" className="action-solid mt-10 max-md:w-full">
        Continue to payment
      </button>
    </form>
  );
}
