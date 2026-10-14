import { expect, type Locator, type Page, test } from "@playwright/test";

// The main journeys, from Home or the Collection to a confirmation, as a
// Shopper on a phone takes them, as one who prefers reduced motion does, and
// by keyboard alone.

const main = (page: Page) => page.getByRole("main");
const cart = (page: Page) => page.getByRole("dialog", { name: "Your cart" });
const chip = (page: Page, name: string) =>
  page
    .getByRole("group", { name: "Colourway" })
    .getByRole("radio", { name, exact: true });
const addToCart = (page: Page) =>
  main(page).getByRole("button", { name: "Add to cart" });
const checkOut = (page: Page) =>
  cart(page).getByRole("link", { name: "Check out" });
const shippingForm = (page: Page) =>
  page.getByRole("form", { name: "Shipping" });
const field = (page: Page, label: string) =>
  shippingForm(page).getByLabel(label, { exact: true });
const continueToPayment = (page: Page) =>
  shippingForm(page).getByRole("button", { name: "Continue to payment" });
const placeOrder = (page: Page) =>
  page
    .getByRole("region", { name: "Payment" })
    .getByRole("button", { name: "Place order" });
const confirmation = (page: Page) =>
  page.getByRole("heading", { level: 1, name: "Thank you, Ingrid." });

const shipping = {
  "Full name": "Ingrid Quellmark",
  Email: "ingrid.quellmark@example.org",
  "Street address": "Fjordgata 731",
  "Town or city": "Vesterholm",
  "Postal code": "N-7319",
  Country: "Zembla",
};

/** Whether the page is no wider than the screen: nothing to pan sideways. */
const fitsTheScreen = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  );

/** How much of an element shows: its own opacity times every ancestor's. */
const shownOpacity = (element: Locator) =>
  element.evaluate((shown) => {
    let opacity = 1;
    for (let node: Element | null = shown; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    return opacity;
  });

test.describe("on a phone", () => {
  test.use({
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  /** From a Timepiece in the cart to the confirmation, by touch. */
  async function checkOutByTouch(page: Page) {
    await checkOut(page).tap();
    await expect(page).toHaveURL("/checkout");
    expect(await fitsTheScreen(page)).toBe(true);

    for (const [label, value] of Object.entries(shipping)) {
      await field(page, label).fill(value);
    }
    await continueToPayment(page).tap();
    await placeOrder(page).tap();

    await expect(confirmation(page)).toBeInViewport();
    expect(await fitsTheScreen(page)).toBe(true);
  }

  test("a Shopper goes from Home's Hero Timepiece to a confirmation", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("status")).toHaveText("Drag to look around");
    expect(await fitsTheScreen(page)).toBe(true);

    // Through the three acts, to the price and the way to the watch.
    const viewIt = main(page).getByRole("link", { name: "View the Timepiece" });
    await viewIt.scrollIntoViewIfNeeded();
    await expect(viewIt).toBeInViewport();
    await expect.poll(() => shownOpacity(viewIt)).toBe(1);
    await viewIt.tap();
    await expect(page).toHaveURL("/collection/tjern");
    expect(await fitsTheScreen(page)).toBe(true);

    await chip(page, "Glacier blue").tap();
    await expect(chip(page, "Glacier blue")).toBeChecked();
    await addToCart(page).tap();
    await expect(cart(page)).toContainText(
      "Glacier blue dial, brushed steel bracelet",
    );

    await checkOutByTouch(page);
  });

  test("a Shopper goes from the menu to the Collection to a confirmation", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("button", { name: "Menu" })
      .tap();
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Collection" })
      .tap();
    await expect(page).toHaveURL("/collection");
    expect(await fitsTheScreen(page)).toBe(true);

    await main(page).getByRole("link", { name: "Skifer", exact: true }).tap();
    await expect(page).toHaveURL("/collection/skifer");
    expect(await fitsTheScreen(page)).toBe(true);
    await addToCart(page).tap();
    await expect(cart(page)).toContainText("Skifer");

    await checkOutByTouch(page);
  });
});

test.describe("for a Shopper who prefers reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  /** Nothing on the page is drawn in 3D or moves of its own accord. */
  async function expectStatic(page: Page) {
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running").length,
      ),
    ).toBe(0);
  }

  for (const path of [
    "/",
    "/collection",
    "/collection/tjern",
    "/collection/skifer",
    "/checkout",
    "/credits",
  ]) {
    test(`${path} is complete and still, and every heading on it can be reached`, async ({
      page,
    }) => {
      // Once the page has settled: the checkout learns from the browser
      // what is in the cart, and sets itself again.
      await page.goto(path, { waitUntil: "networkidle" });

      const headings = main(page).getByRole("heading");
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index++) {
        const heading = headings.nth(index);
        await heading.scrollIntoViewIfNeeded();
        await expect(heading).toBeInViewport();
        expect(await shownOpacity(heading)).toBe(1);
        await expectStatic(page);
      }
    });
  }

  test("a Shopper goes from Home's Hero Timepiece to a confirmation", async ({
    page,
  }) => {
    await page.goto("/");

    const viewIt = main(page).getByRole("link", { name: "View the Timepiece" });
    await viewIt.scrollIntoViewIfNeeded();
    expect(await shownOpacity(viewIt)).toBe(1);
    await viewIt.click();
    await expect(page).toHaveURL("/collection/tjern");
    await expectStatic(page);

    // The Colourway changes the Still, not a scene.
    await chip(page, "Rowan red").check();
    await expect(
      main(page).getByRole("img", { name: /^The Tjern/ }).locator("img"),
    ).toHaveAttribute("src", /rowan-red/);
    await addToCart(page).click();
    await expect(cart(page)).toBeVisible();
    await expectStatic(page);

    await checkOut(page).click();
    await expect(page).toHaveURL("/checkout");
    for (const [label, value] of Object.entries(shipping)) {
      await field(page, label).fill(value);
    }
    await continueToPayment(page).click();
    await placeOrder(page).click();

    await expect(confirmation(page)).toBeVisible();
    await expectStatic(page);
  });
});

test("a Shopper goes from the Collection to a confirmation by keyboard alone", async ({
  page,
}) => {
  await page.goto("/collection");

  await tabTo(
    page,
    main(page).getByRole("link", { name: "Tjern", exact: true }),
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/collection/tjern");

  await tabTo(page, chip(page, "Deep blue"));
  await page.keyboard.press("ArrowRight");
  await expect(chip(page, "Glacier blue")).toBeChecked();

  await tabTo(page, addToCart(page));
  await page.keyboard.press("Enter");
  await expect(cart(page)).toContainText(
    "Glacier blue dial, brushed steel bracelet",
  );

  await tabTo(page, checkOut(page));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/checkout");

  await tabTo(page, field(page, "Full name"));
  for (const value of Object.values(shipping)) {
    await page.keyboard.type(value);
    await page.keyboard.press("Tab");
  }
  await expect(continueToPayment(page)).toBeFocused();
  await page.keyboard.press("Enter");

  await tabTo(page, placeOrder(page));
  await page.keyboard.press("Enter");

  await expect(confirmation(page)).toBeVisible();
  await expect(main(page)).toContainText(
    "Glacier blue dial, brushed steel bracelet",
  );
});

/** Presses Tab until the keyboard is on this, as a Shopper would. */
async function tabTo(page: Page, target: Locator) {
  for (let presses = 0; presses < 60; presses++) {
    if (await target.evaluate((element) => element === document.activeElement))
      return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Tab never came to it");
}
