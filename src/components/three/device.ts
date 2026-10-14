// What a scene asks of the device it is drawn on. Each is read once, in the
// browser, as the scene loads.

/** A phone or a tablet: a touch screen, and no pointer that hovers. */
const HANDHELD = "(hover: none) and (pointer: coarse)";

/**
 * Whether the device is a phone or a tablet. It gets the lighter model and
 * fewer pixels: its screen is small enough that neither shows, and its
 * graphics chip and battery are a fraction of a laptop's.
 */
export function isHandheld(): boolean {
  return window.matchMedia(HANDHELD).matches;
}

/**
 * The most pixels a scene draws for each pixel of the page. A phone's screen
 * packs two or three; past one and a half the eye cannot tell them apart at
 * arm's length, and every one is paid for on every frame.
 */
export function pixelRatioCap(): number {
  return isHandheld() ? 1.5 : 2;
}

/**
 * Whether the browser is driven by automation: the browser tests', or the
 * one `npm run stills` photographs in. Those draw in software on a busy
 * machine, far slower than any Shopper's device, so how fast they draw says
 * nothing about one and their frame rate is not judged.
 */
export function isAutomated(): boolean {
  return navigator.webdriver;
}
