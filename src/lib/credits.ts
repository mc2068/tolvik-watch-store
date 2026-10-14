// The 3D models Tolvik ships are CC-BY-4.0, which requires crediting the
// artist wherever the work is shown. Each credit is recorded here for the
// credits page and the README, and `npm run models` checks it against the
// licence file in the download before writing it into the model.

export type ModelCredit = {
  title: string;
  source: string;
  author: string;
  authorUrl: string;
  licence: string;
  licenceUrl: string;
  /** What was done to the model for this site, which the licence asks be said. */
  changes: string;
};

export const heroModelCredit: ModelCredit = {
  title: "Stainless Steel Wristwatch Analog Watch",
  source:
    "https://sketchfab.com/3d-models/stainless-steel-wristwatch-analog-watch-029a0b692d474e55ac29292fc30fb153",
  author: "render-lab",
  authorUrl: "https://sketchfab.com/render-lab",
  licence: "CC-BY-4.0",
  licenceUrl: "http://creativecommons.org/licenses/by/4.0/",
  changes:
    "Simplified and compressed for the web, its three hands separated so they can tell the time, and given new materials and dial colours.",
};

export const escapementModelCredit: ModelCredit = {
  title: "Swiss lever escapement mechanism",
  source:
    "https://sketchfab.com/3d-models/swiss-lever-escapement-mechanism-96cf82a6bdcd4ddda7635fbd33d0e016",
  author: "C. Yamahata",
  authorUrl: "https://sketchfab.com/cyamahat",
  licence: "CC-BY-4.0",
  licenceUrl: "http://creativecommons.org/licenses/by/4.0/",
  changes: "Simplified and compressed for the web, and given new materials.",
};

/** Every model the site ships, in the order the credits page lists them. */
export const modelCredits: readonly ModelCredit[] = [
  heroModelCredit,
  escapementModelCredit,
];

/** The credit sentence in the wording the model's `license.txt` asks for. */
export function creditLine(credit: ModelCredit): string {
  return `This work is based on "${credit.title}" (${credit.source}) by ${credit.author} (${credit.authorUrl}) licensed under ${credit.licence} (${credit.licenceUrl})`;
}
