const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

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
        if (minute === 0) return null;
        const isHour = minute % 5 === 0;

        return (
          <line
            key={minute}
            x1="0"
            x2="0"
            y1={isHour ? -84 : -94}
            y2="-98"
            transform={`rotate(${minute * 6})`}
            vectorEffect="non-scaling-stroke"
            className={isHour ? "stroke-platinum-dim" : "stroke-platinum-faint"}
            strokeWidth={isHour ? 1.5 : 1}
          />
        );
      })}

      {[-1.6, 1.6].map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1="-84"
          y2="-98"
          vectorEffect="non-scaling-stroke"
          className="stroke-steel"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}
