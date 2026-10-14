import { expect, type Page, test } from "@playwright/test";

// Every page, at every width from the narrowest phone to a wide desktop
// screen: nothing spills sideways, and on a phone every control is big
// enough for a thumb.

const pages = [
  "/",
  "/collection",
  "/collection/tjern",
  "/collection/skifer",
  "/checkout",
  "/credits",
  "/an-address-that-does-not-exist",
];

const widths = [360, 390, 768, 1024, 1280, 1920];

// The smallest a control may be to be tapped without missing, in pixels.
const THUMB = 44;

/** Whether the page is no wider than the screen: nothing to pan sideways. */
const fitsTheScreen = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  );

/**
 * Every control within `scope` that is smaller than a thumb, as its name
 * and size. A link inside a sentence is left out: it is as tall as the line
 * it is in, and the words around it are what it is found by. A link whose
 * `after` layer is stretched over a card is as big as the card.
 */
const tooSmall = (page: Page, scope = "body") =>
  page.evaluate(
    ({ thumb, scope }) => {
      const inASentence = (control: Element) =>
        control.tagName === "A" &&
        control.parentElement!.textContent!.trim() !==
          control.textContent!.trim();
      const tapArea = (control: HTMLElement) =>
        getComputedStyle(control, "::after").position === "absolute"
          ? control.offsetParent!.getBoundingClientRect()
          : control.getBoundingClientRect();

      const controls = document
        .querySelector(scope)!
        .querySelectorAll<HTMLElement>("a, button, input, select, textarea");
      return [...controls].flatMap((control) => {
        const box = tapArea(control);
        if (box.width === 0 || box.height === 0) return [];
        if (inASentence(control)) return [];
        // Measured to the pixel: a panel still sliding in can leave a box a
        // hair short of its size.
        const [width, height] = [box.width, box.height].map(Math.round);
        if (width >= thumb && height >= thumb) return [];
        const name =
          control.getAttribute("aria-label") ??
          control.textContent?.trim() ??
          control.getAttribute("name");
        return [`${name} (${width}x${height})`];
      });
    },
    { thumb: THUMB, scope },
  );

for (const width of widths) {
  test.describe(`at ${width} pixels wide`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const path of pages) {
      test(`${path} fits the screen`, async ({ page }) => {
        await page.goto(path);

        expect(await fitsTheScreen(page)).toBe(true);
      });
    }
  });
}

test.describe("on a phone", () => {
  test.use({
    viewport: { width: 360, height: 780 },
    isMobile: true,
    hasTouch: true,
  });

  for (const path of pages) {
    test(`${path} has no control too small for a thumb`, async ({ page }) => {
      await page.goto(path);

      expect(await tooSmall(page)).toEqual([]);
    });
  }

  test("the menu and the cart have no control too small for a thumb", async ({
    page,
  }) => {
    await page.goto("/collection/tjern");
    await page
      .getByRole("main")
      .getByRole("button", { name: "Add to cart" })
      .tap();
    const cart = page.getByRole("dialog", { name: "Your cart" });
    await expect(cart).toBeVisible();
    expect(await tooSmall(page, "dialog[open]")).toEqual([]);

    await cart.getByRole("button", { name: "Close" }).tap();
    await page.getByRole("button", { name: "Menu" }).tap();
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link").first(),
    ).toBeVisible();
    expect(await tooSmall(page, "header")).toEqual([]);
  });
});
