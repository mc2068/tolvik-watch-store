"use client";

// PROTOTYPE, throwaway: the bar that flips between the variants being
// compared. See src/lib/prototype-variant.ts.

import { useEffect, useSyncExternalStore } from "react";

import {
  prototypeVariant,
  VARIANT_KEYS,
  VARIANTS,
} from "@/lib/prototype-variant";

function step(by: number) {
  const at = VARIANT_KEYS.indexOf(prototypeVariant.chosen());
  const next = (at + by + VARIANT_KEYS.length) % VARIANT_KEYS.length;
  prototypeVariant.choose(VARIANT_KEYS[next]);
}

export function PrototypeSwitcher() {
  const chosen = useSyncExternalStore(
    prototypeVariant.onChange,
    prototypeVariant.chosen,
    () => "A" as const,
  );
  const inEffect = useSyncExternalStore(
    prototypeVariant.onChange,
    prototypeVariant.get,
    () => "A" as const,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A stray merge must never ship the bar.
  if (process.env.NODE_ENV === "production") return null;

  // Deliberately off the Tolvik look, so it cannot be mistaken for part of
  // the design being judged.
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        borderRadius: 999,
        background: "#f5d90a",
        color: "#111",
        font: "600 13px/1.2 ui-sans-serif, system-ui, sans-serif",
        boxShadow: "0 6px 24px rgb(0 0 0 / 0.5)",
        maxWidth: "calc(100vw - 24px)",
      }}
    >
      <button
        type="button"
        aria-label="Previous variant"
        onClick={() => step(-1)}
        style={{ padding: "4px 8px" }}
      >
        ←
      </button>
      <span>
        {chosen} ({VARIANTS[chosen]})
        {inEffect !== chosen && `, shown as ${inEffect} on this narrow screen`}
      </span>
      <button
        type="button"
        aria-label="Next variant"
        onClick={() => step(1)}
        style={{ padding: "4px 8px" }}
      >
        →
      </button>
    </div>
  );
}
