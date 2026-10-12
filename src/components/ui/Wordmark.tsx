import { site } from "@/lib/site";

// The Tolvik wordmark: the name in the display face behind a doubled baton,
// the marker a watch dial carries at twelve o'clock.
export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-3.5 font-display text-body leading-none font-normal tracking-wordmark uppercase">
      <span aria-hidden="true" className="flex gap-0.75">
        {["left", "right"].map((baton) => (
          <span key={baton} className="h-4 w-0.5 bg-steel" />
        ))}
      </span>
      {/* The negative margin takes back the tracking after the last letter. */}
      <span className="-mr-(--tracking-wordmark)">{site.name}</span>
    </span>
  );
}
