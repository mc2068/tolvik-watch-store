// The 3D models Tolvik ships are CC-BY-4.0, which requires crediting the
// artist wherever the work is shown. The credits page and the README read
// their credit lines from here.

export type ModelCredit = {
  title: string;
  source: string;
  author: string;
  authorUrl: string;
  licence: string;
  licenceUrl: string;
};

export const heroModelCredit: ModelCredit = {
  title: "Stainless Steel Wristwatch Analog Watch",
  source:
    "https://sketchfab.com/3d-models/stainless-steel-wristwatch-analog-watch-029a0b692d474e55ac29292fc30fb153",
  author: "render-lab",
  authorUrl: "https://sketchfab.com/render-lab",
  licence: "CC-BY-4.0",
  licenceUrl: "http://creativecommons.org/licenses/by/4.0/",
};

/** The credit sentence in the wording the model's `license.txt` asks for. */
export function creditLine(credit: ModelCredit): string {
  return `This work is based on "${credit.title}" (${credit.source}) by ${credit.author} (${credit.authorUrl}) licensed under ${credit.licence} (${credit.licenceUrl})`;
}
