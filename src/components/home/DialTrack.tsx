// The dial is drawn in a 200-unit square centred on its own middle, so every
// marker is a line from the dial's edge inwards, turned to its minute.
const EDGE = 98;
const TICK_LENGTH = 4;
const BATON_LENGTH = 14;
// Half the gap between the two batons of the doubled marker at twelve.
const TWELVE_OFFSET = 1.6;

const MINUTES = Array.from({ length: 59 }, (_, index) => index + 1);

// The minute track of a Tolvik dial, drawn as the figure for the craftsmanship
// section: a tick per minute, a baton per hour, and the doubled marker at
// twelve in the accent. Decoration only, so it is hidden from screen readers.
//
// Stroke widths are in screen pixels (non-scaling), so the lines stay as fine
// on a tablet, where the dial is drawn large, as on a laptop.
export function DialTrack({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-100 -100 200 200"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {MINUTES.map((minute) => {
        const isHour = minute % 5 === 0;

        return (
          <line
            key={minute}
            y1={-EDGE + (isHour ? BATON_LENGTH : TICK_LENGTH)}
            y2={-EDGE}
            transform={`rotate(${minute * 6})`}
            vectorEffect="non-scaling-stroke"
            className={isHour ? "stroke-platinum-dim" : "stroke-platinum-faint"}
            strokeWidth={isHour ? 1.5 : 1}
          />
        );
      })}

      {[-TWELVE_OFFSET, TWELVE_OFFSET].map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={-EDGE + BATON_LENGTH}
          y2={-EDGE}
          vectorEffect="non-scaling-stroke"
          className="stroke-steel"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}
