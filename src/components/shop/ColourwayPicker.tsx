"use client";

import { useId } from "react";

import { useColourwayChoice } from "@/components/shop/ColourwayChoice";

type Chip = {
  name: string;
  /** The colour it is, where it is a colour, as a hex colour. */
  swatch?: string;
};

/**
 * Where the Shopper chooses a Colourway: a dial colour and a bracelet, each
 * picked apart from the other, with the Colourway the two make named above
 * them.
 */
export function ColourwayPicker() {
  const { colourways, chosen, choose } = useColourwayChoice();
  const heading = useId();

  // Every Colourway is one dial colour on one bracelet, so the dials and
  // the bracelets to offer are the different ones among them.
  const dials: Chip[] = [];
  const bracelets: Chip[] = [];
  for (const { dial, bracelet, finish } of colourways) {
    if (!dials.some(({ name }) => name === dial)) {
      dials.push({ name: dial, swatch: finish.dial });
    }
    if (!bracelets.some(({ name }) => name === bracelet)) {
      bracelets.push({ name: bracelet });
    }
  }

  const chooseBy = (dial: string, bracelet: string) => {
    const colourway = colourways.find(
      (colourway) => colourway.dial === dial && colourway.bracelet === bracelet,
    );
    if (colourway) choose(colourway);
  };

  return (
    <div role="group" aria-labelledby={heading}>
      <h2 id={heading} className="text-small tracking-open text-platinum-dim">
        Colourway
      </h2>
      {/* `aria-live` has a screen reader say the new name when it changes. */}
      <p aria-live="polite" className="mt-1 font-display text-lead">
        {chosen.name}
      </p>

      <Chips
        legend="Dial"
        chips={dials}
        chosen={chosen.dial}
        onChoose={(dial) => chooseBy(dial, chosen.bracelet)}
      />
      <Chips
        legend="Bracelet"
        chips={bracelets}
        chosen={chosen.bracelet}
        onChoose={(bracelet) => chooseBy(chosen.dial, bracelet)}
      />
    </div>
  );
}

/**
 * One of the two choices, as a set of radio buttons. They are the browser's
 * own, so the keyboard works them as it does any others: Tab comes to the
 * set and the arrow keys move the choice within it. Each is drawn as a
 * chip, its button unseen over it. A colour is shown and not spelt out: its
 * name is there for a screen reader, and for a pointer that rests on it.
 */
function Chips({
  legend,
  chips,
  chosen,
  onChoose,
}: {
  legend: string;
  chips: Chip[];
  chosen: string;
  onChoose: (name: string) => void;
}) {
  // Radio buttons belong to one set by sharing a name. `useId` has React
  // make one up, so the two sets here can never share theirs.
  const set = useId();

  return (
    <fieldset className="mt-6">
      <legend className="text-small tracking-open text-platinum-dim">
        {legend}
      </legend>
      <div className="mt-3 flex flex-wrap gap-3">
        {chips.map(({ name, swatch }) => (
          <label
            key={name}
            title={swatch && name}
            className={`choice-chip ${swatch ? "choice-swatch" : ""}`}
          >
            <input
              type="radio"
              name={set}
              value={name}
              checked={name === chosen}
              onChange={() => onChoose(name)}
            />
            {swatch ? (
              <>
                <span
                  aria-hidden="true"
                  className="size-8 border border-platinum-faint"
                  style={{ backgroundColor: swatch }}
                />
                <span className="sr-only">{name}</span>
              </>
            ) : (
              name
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
