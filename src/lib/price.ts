const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** A price as the site shows it: whole US dollars, such as $6,400. */
export function formatPrice(price: number): string {
  return dollars.format(price);
}
