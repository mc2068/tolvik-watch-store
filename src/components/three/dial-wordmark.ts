import { site } from "@/lib/site";
import { token } from "@/lib/tokens";

// The Tolvik wordmark as it is printed on the dial: the doubled baton above
// the name, the same mark the header carries. It is drawn onto a 2D canvas
// with the site's own display face and tokens, then used as a texture.

/**
 * The size of the canvas the wordmark is drawn on. It is twice as wide as it
 * is tall, and the plate it is printed on matches. The canvas must have this
 * size before it becomes a texture: the graphics card fixes a texture's size
 * the first time it is drawn.
 */
export const DIAL_WORDMARK_SIZE = { width: 1024, height: 512 } as const;

const NAME_SIZE = 132;
const BATON = { width: 12, height: 104, gap: 16, top: 64 } as const;
const NAME_BASELINE = 330;

/** Draws the wordmark, once the display face has loaded. */
export async function drawDialWordmark(canvas: HTMLCanvasElement) {
  const font = `400 ${NAME_SIZE}px ${token("--font-display")}`;
  const name = site.name.toUpperCase();
  // If the face cannot be fetched, the name is drawn in the fallback serif.
  await document.fonts.load(font, name).catch(() => {});

  const { width } = DIAL_WORDMARK_SIZE;
  const pen = canvas.getContext("2d");
  if (!pen) return;

  pen.fillStyle = token("--color-steel");
  for (const side of [-1, 1]) {
    const x = width / 2 + (side * (BATON.gap + BATON.width)) / 2;
    pen.fillRect(x - BATON.width / 2, BATON.top, BATON.width, BATON.height);
  }

  // Letter by letter, so the name is tracked as widely as the header's
  // wordmark in every browser.
  pen.font = font;
  pen.fillStyle = token("--color-platinum");
  const tracking = NAME_SIZE * Number.parseFloat(token("--tracking-wordmark"));
  const letters = [...name].map((letter) => ({
    letter,
    width: pen.measureText(letter).width,
  }));
  const nameWidth =
    letters.reduce((sum, { width }) => sum + width, 0) +
    tracking * (letters.length - 1);
  let x = (width - nameWidth) / 2;
  for (const { letter, width: letterWidth } of letters) {
    pen.fillText(letter, x, NAME_BASELINE);
    x += letterWidth + tracking;
  }
}
