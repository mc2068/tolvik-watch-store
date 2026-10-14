export const site = {
  name: "Tolvik",
  description:
    "A concept storefront for Tolvik, an invented watch brand. Nothing here is for sale.",
  navigation: [
    { label: "Collection", href: "/collection" },
    { label: "Craftsmanship", href: "/#craftsmanship" },
  ],
  credit: {
    lead: "Concept site designed and built by",
    name: "Mohamed Chakroun",
    href: "https://github.com/mc2068",
  },
} as const;

/**
 * The image a link to the site shows where it is shared, in pixels: the
 * size Open Graph asks for. `npm run stills` photographs it from the
 * studio's share room into `src/app/opengraph-image.jpg`, which Next
 * offers for every page.
 */
export const SHARE_IMAGE = { width: 1200, height: 630 } as const;

/** The address of a Collection: its place on the Collection page. */
export function collectionPath(slug: string): string {
  return `/collection#${slug}`;
}

/** The address of a Timepiece's own page. */
export function timepiecePath(slug: string): string {
  return `/collection/${slug}`;
}
