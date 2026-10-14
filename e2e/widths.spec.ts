import { expect, type Page, test } from "@playwright/test";

// Every page, at every width from the narrowest phone to a wide desktop
// screen: nothing spills sideways, and on a phone every control is big
// enough for a thumb. The Demo Checkout, which sends a Shopper with an empty
// cart back to the Collection, is taken a step at a time with a Timepiece in
// the cart.

const pages = [
  "/",
  "/collection",
  "/collection/tjern",
  "/collection/skifer",
  "/credits",
  "/an-address-that-does-not-exist",
];

const widths = [360, 390, 768, 1024, 1280, 1920];

const main = (page: Page) => page.getByRole("main");

/**
 * Takes a Timepiece through the Demo Checkout to its confirmation, and
 * calls `atEachStep` on the shipping form, the payment step and the
 * confirmation.
 */
async function throughTheCheckout(
  page: Page,
  atEachStep: () => Promise<void>,
) {
  await page.goto("/collection/skifer");
  await main(page).getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("dialog", { name: "Your cart" })).toBeVisible();
  await page.goto("/checkout");

  const form = page.getByRole("form", { name: "Shipping" });
  await expect(form).toBeVisible();
  await atEachStep();

  for (const [label, value] of Object.entries({
    "Full name": "Ingrid Quellmark",
    Email: "ingrid.quellmark@example.org",
    "Street address": "Fjordgata 731",
    "Town or city": "Vesterholm",
    "Postal code": "N-7319",
    Country: "Zembla",
  })) {
    await form.getByLabel(label, { exact: true }).fill(value);
  }
  await form.getByRole("button", { name: "Continue to payment" }).click();
  const placeOrder = page
    .getByRole("region", { name: "Payment" })
    .getByRole("button", { name: "Place order" });
  await expect(placeOrder).toBeVisible();
  await atEachStep();

  await placeOrder.click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Thank you, Ingrid." }),
  ).toBeVisible();
  await atEachStep();
}

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

    test("the Demo Checkout fits the screen at every step", async ({
      page,
    }) => {
      await throughTheCheckout(page, async () => {
        expect(await fitsTheScreen(page)).toBe(true);
      });
    });
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

  test("the Demo Checkout has no control too small for a thumb at any step", async ({
    page,
  }) => {
    await throughTheCheckout(page, async () => {
      expect(await tooSmall(page)).toEqual([]);
    });
  });

  test("Home fits the screen all through the Exploded View, its names in it", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("status")).toHaveText("Drag to look around");
    const names = page
      .getByRole("list", { name: "The seven parts, front to back" })
      .getByRole("listitem");

    // From the watch closed, through open, to closed again under the price.
    for (const share of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
      await page.evaluate((share) => {
        const act = document
          .getElementById("exploded-view-heading")!
          .closest("section")!;
        const top = act.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top + (act.offsetHeight - innerHeight) * share);
      }, share);
      await page.waitForTimeout(800);

      expect(await fitsTheScreen(page)).toBe(true);
      for (const name of await names.all()) {
        const box = (await name.locator("span").first().boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(360);
      }
    }
  });

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
