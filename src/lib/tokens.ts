// The Tolvik look's tokens live in globals.css. Code that draws outside CSS,
// onto a 2D canvas or into the 3D scene, reads them from the page with this,
// so a colour or a face is still named in one place.

/** The value of a design token such as `--color-steel`. Browser only. */
export function token(name: `--${string}`): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
