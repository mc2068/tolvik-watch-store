// What the Demo Checkout works out, apart from how it is shown: whether a
// shipping form is filled in well enough to go on, and an order number for
// the confirmation. Nothing here keeps or sends what the Shopper types.

/** Where an order would be sent, as the Shopper typed it. */
export type Shipping = {
  name: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
};

/** A shipping form as it opens, with nothing typed in it. */
export const emptyShipping: Shipping = {
  name: "",
  email: "",
  address: "",
  city: "",
  postcode: "",
  country: "",
};

/** What is wrong with each field of a shipping form that has anything wrong. */
export type ShippingProblems = Partial<Record<keyof Shipping, string>>;

// A name, an @, and a domain with a dot in it, with no spaces anywhere.
const anEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Three to ten letters, digits, spaces and hyphens: loose enough for any
// country's postal codes, and enough to catch a slip of the keyboard.
const aPostcode = /^[a-z0-9 -]{3,10}$/i;

/** What each field asks for when it is left empty. */
const askedWhenEmpty: Shipping = {
  name: "Enter your full name.",
  email: "Enter your email address.",
  address: "Enter your street address.",
  city: "Enter your town or city.",
  postcode: "Enter your postal code.",
  country: "Enter your country.",
};

/**
 * What the Shopper must fix before the form can go on, field by field, in
 * words to show beside the field. A field with nothing to fix is left out,
 * so a form filled in well comes back empty.
 */
export function checkShipping(shipping: Shipping): ShippingProblems {
  const problems: ShippingProblems = {};

  for (const field of fieldsOf(shipping)) {
    if (!shipping[field].trim()) problems[field] = askedWhenEmpty[field];
  }

  const email = shipping.email.trim();
  if (email && !anEmail.test(email)) {
    problems.email = "Enter an email address such as name@example.com.";
  }

  const postcode = shipping.postcode.trim();
  if (postcode && !aPostcode.test(postcode)) {
    problems.postcode = "Enter a postal code of letters and digits.";
  }

  return problems;
}

/**
 * The shipping form as it goes on to the payment step: each field without
 * the spaces a Shopper may leave either side of what they type.
 */
export function settleShipping(shipping: Shipping): Shipping {
  const settled = { ...shipping };
  for (const field of fieldsOf(shipping)) {
    settled[field] = shipping[field].trim();
  }
  return settled;
}

const fieldsOf = (shipping: Shipping) =>
  Object.keys(shipping) as (keyof Shipping)[];

/**
 * An order number for the confirmation: TLV and six digits. It is invented
 * on the spot and kept nowhere, since there is no order to look up.
 */
export function inventOrderNumber(random: () => number = Math.random): string {
  return `TLV-${100_000 + Math.floor(random() * 900_000)}`;
}
