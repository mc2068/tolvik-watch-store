import { expect, type Page, test } from "@playwright/test";

const cart = (page: Page) => page.getByRole("dialog", { name: "Your cart" });
// A line of the cart, found by anything it says: a name, a Colourway.
const line = (page: Page, saying: string) =>
  cart(page).getByRole("listitem").filter({ hasText: saying });
const quantity = (page: Page, saying: string) =>
  line(page, saying).getByRole("group", { name: "Quantity" });
const total = (page: Page) =>
  cart(page).getByText("Total").locator("xpath=following-sibling::*");
const addToCart = (page: Page) =>
  page.getByRole("main").getByRole("button", { name: "Add to cart" });
// The cart's place in the navigation, which says how many Timepieces it holds.
const cartButton = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: /^Cart/ });
const close = (page: Page) => cart(page).getByRole("button", { name: "Close" });
// The page's right edge: the screen's, less a scrollbar where there is one.
const rightEdge = async (page: Page) => {
  const header = (await page.getByRole("banner").boundingBox())!;
  return header.x + header.width;
};

const colourwayChip = (page: Page, name: string) =>
  page.getByRole("group", { name: "Colourway" }).getByRole("radio", {
    name,
    exact: true,
  });

/** Adds the Timepiece at this address to the cart, and closes the cart. */
async function add(page: Page, address: string) {
  await page.goto(address);
  await addToCart(page).click();
  await expect(cart(page)).toBeVisible();
  await close(page).click();
  await expect(cart(page)).toBeHidden();
}

test("a Shopper adds a Timepiece from its page, and the cart slides out to confirm it", async ({
  page,
}) => {
  await page.goto("/collection/skifer");
  await expect(cart(page)).toBeHidden();

  await addToCart(page).click();

  await expect(cart(page)).toBeVisible();
  await expect(cart(page).getByRole("listitem")).toHaveCount(1);
  await expect(
    line(page, "Skifer").getByRole("link", { name: "Skifer" }),
  ).toHaveAttribute("href", "/collection/skifer");
  await expect(line(page, "Skifer")).toContainText("$5,800");
  await expect(quantity(page, "Skifer").getByRole("status")).toHaveText("1");
  // It slides out from the right edge of the page, and comes to rest there.
  await expect
    .poll(async () => {
      const box = (await cart(page).boundingBox())!;
      return box.x + box.width;
    })
    .toBe(await rightEdge(page));
});

test("the cart opens from any page, and the navigation counts what is in it", async ({
  page,
}) => {
  for (const address of [
    "/",
    "/collection",
    "/an-address-with-nothing-at-it",
  ]) {
    await page.goto(address);

    await expect(cartButton(page)).toHaveAccessibleName("Cart, 0 Timepieces");
    await cartButton(page).click();
    await expect(cart(page)).toBeVisible();
    await close(page).click();
    await expect(cart(page)).toBeHidden();
  }

  await add(page, "/collection/gran");
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 1 Timepiece");

  // A second of the same Timepiece and one of another: three in all.
  await add(page, "/collection/gran");
  await add(page, "/collection/lyng");
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 3 Timepieces");
  // The number is there to be seen, and not only to be read out.
  await expect(cartButton(page)).toHaveText("Cart3");

  // The count goes with the Shopper to every other page.
  await page.goto("/");
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 3 Timepieces");
  await cartButton(page).click();
  await expect(cart(page).getByRole("listitem")).toHaveCount(2);
  await expect(quantity(page, "Gran").getByRole("status")).toHaveText("2");
});

test("a Shopper changes a line's quantity and removes a line, and the total follows", async ({
  page,
}) => {
  await add(page, "/collection/skifer");
  await page.goto("/collection/kull");
  await addToCart(page).click();

  // $5,800 and $7,600.
  await expect(total(page)).toHaveText("$13,400");

  const more = quantity(page, "Kull").getByRole("button", { name: "One more" });
  const fewer = quantity(page, "Kull").getByRole("button", {
    name: "One fewer",
  });

  await more.click();
  await more.click();
  await expect(quantity(page, "Kull").getByRole("status")).toHaveText("3");
  await expect(line(page, "Kull")).toContainText("$22,800");
  await expect(total(page)).toHaveText("$28,600");
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 4 Timepieces");

  await fewer.click();
  await expect(quantity(page, "Kull").getByRole("status")).toHaveText("2");
  await expect(total(page)).toHaveText("$21,000");

  // The last one is not taken away by counting down: that is what Remove is for.
  await fewer.click();
  await expect(fewer).toBeDisabled();
  await fewer.click({ force: true });
  await expect(quantity(page, "Kull").getByRole("status")).toHaveText("1");

  await line(page, "Skifer").getByRole("button", { name: "Remove" }).click();
  await expect(cart(page).getByRole("listitem")).toHaveCount(1);
  await expect(line(page, "Skifer")).toHaveCount(0);
  await expect(total(page)).toHaveText("$7,600");
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 1 Timepiece");
  // The keyboard is not left on the button that went with the line.
  await expect(close(page)).toBeFocused();
});

test("the Hero Timepiece is added in the Colourway chosen, and each Colourway is a line of its own", async ({
  page,
}) => {
  await page.goto("/collection/tjern");

  // First as the Catalogue lists it.
  await addToCart(page).click();
  await expect(line(page, "Tjern")).toContainText(
    "Deep blue dial, brushed steel bracelet",
  );
  await close(page).click();

  await colourwayChip(page, "Rowan red").check();
  await colourwayChip(page, "Blackened steel").check();
  await addToCart(page).click();

  await expect(cart(page).getByRole("listitem")).toHaveCount(2);
  await expect(
    line(page, "Rowan red dial, blackened steel bracelet"),
  ).toContainText("Tjern");
  await expect(
    line(page, "Deep blue dial, brushed steel bracelet"),
  ).toContainText("Tjern");
  // Each line shows the watch in its own Colourway.
  await expect(
    line(page, "Rowan red dial, blackened steel bracelet").getByRole("img"),
  ).toHaveAccessibleName(
    "The Tjern with a rowan red dial and a blackened steel bracelet",
  );

  // The same Colourway again goes on the line it already has.
  await close(page).click();
  await addToCart(page).click();
  await expect(cart(page).getByRole("listitem")).toHaveCount(2);
  await expect(
    quantity(page, "Rowan red dial, blackened steel bracelet").getByRole(
      "status",
    ),
  ).toHaveText("2");
  // Three at $6,400.
  await expect(total(page)).toHaveText("$19,200");

  // A Timepiece without Colourways names none.
  await close(page).click();
  await add(page, "/collection/skifer");
  await cartButton(page).click();
  await expect(line(page, "Skifer")).not.toContainText("dial");
});

test("the cart survives a reload", async ({ page }) => {
  await page.goto("/collection/tjern");
  await colourwayChip(page, "Glacier blue").check();
  await addToCart(page).click();
  await quantity(page, "Tjern")
    .getByRole("button", { name: "One more" })
    .click();
  await close(page).click();
  await add(page, "/collection/midnatt");

  await page.reload();

  // It comes back closed, with everything in it.
  await expect(cart(page)).toBeHidden();
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 3 Timepieces");
  await cartButton(page).click();
  await expect(cart(page).getByRole("listitem")).toHaveCount(2);
  await expect(
    quantity(page, "Glacier blue dial, brushed steel bracelet").getByRole(
      "status",
    ),
  ).toHaveText("2");
  await expect(line(page, "Midnatt")).toContainText("$8,200");
  // Two at $6,400 and one at $8,200.
  await expect(total(page)).toHaveText("$21,000");
});

test("a cart line holds only the Timepiece, the Colourway and the quantity", async ({
  page,
}) => {
  await page.goto("/collection/tjern");
  await addToCart(page).click();
  await expect(cart(page)).toBeVisible();

  // What the browser keeps of the cart between visits.
  const kept = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("tolvik-cart")!),
  );

  expect(kept.state).toEqual({
    lines: [
      { timepiece: "tjern", colourway: "deep-blue-brushed-steel", quantity: 1 },
    ],
  });
});

test("an empty cart invites the Shopper to the Collection", async ({
  page,
}) => {
  await page.goto("/");
  await cartButton(page).click();

  await expect(cart(page).getByRole("listitem")).toHaveCount(0);
  await expect(cart(page).getByText("Nothing here yet.")).toBeVisible();
  await expect(cart(page).getByText("Total")).toHaveCount(0);

  await cart(page).getByRole("link", { name: "View the Collection" }).click();

  await expect(page).toHaveURL("/collection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Collection",
  );
  await expect(cart(page)).toBeHidden();
});

test("a cart emptied by removing its last line says so again", async ({
  page,
}) => {
  await page.goto("/collection/lyng");
  await addToCart(page).click();

  await line(page, "Lyng").getByRole("button", { name: "Remove" }).click();

  await expect(cart(page).getByText("Nothing here yet.")).toBeVisible();
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 0 Timepieces");
});

test("while open, the cart holds the keyboard, closes on Escape and gives the keyboard back", async ({
  page,
}) => {
  await page.goto("/collection/skifer");

  // By keyboard alone: the cart must not need a pointer.
  await addToCart(page).focus();
  await page.keyboard.press("Enter");
  await expect(cart(page)).toBeVisible();
  await expect(close(page)).toBeFocused();

  // Tab goes round what is in the cart and never out to the page behind it.
  const seen = new Set<string>();
  for (let presses = 0; presses < 12; presses++) {
    await page.keyboard.press("Tab");
    const where = await page.evaluate(() => {
      const on = document.activeElement;
      if (!on || on === document.body) return "nothing";
      if (!on.closest("dialog")) return "the page behind";
      return on.getAttribute("aria-label") ?? on.textContent ?? "";
    });
    seen.add(where);
  }
  expect(seen).not.toContain("the page behind");
  // And it reaches everything in the cart on the way.
  for (const control of ["Close", "Skifer", "One fewer", "One more"]) {
    expect([...seen]).toContain(control);
  }
  expect([...seen].some((name) => name.startsWith("Remove"))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(cart(page)).toBeHidden();
  await expect(addToCart(page)).toBeFocused();

  // Opened from the navigation, it gives the keyboard back there.
  await cartButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(cart(page)).toBeVisible();
  await close(page).press("Enter");
  await expect(cart(page)).toBeHidden();
  await expect(cartButton(page)).toBeFocused();
});

test("the page behind the cart keeps its place while the cart is open", async ({
  page,
}) => {
  await page.goto("/collection");
  await page.evaluate(() => window.scrollTo(0, 400));

  // Clicked where it is: Playwright's own click would first scroll the
  // button "into view", and move the page doing it.
  const button = (await cartButton(page).boundingBox())!;
  await page.mouse.click(
    button.x + button.width / 2,
    button.y + button.height / 2,
  );
  await expect(cart(page)).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(400);

  // The wheel, turned over the dimmed page, does not scroll it.
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBe(400);

  // A click on the dimmed page beside the cart closes it.
  await page.mouse.click(200, 400);
  await expect(cart(page)).toBeHidden();
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the cart fills the screen and everything in it is in reach", async ({
    page,
  }) => {
    await page.goto("/collection/tjern");
    await addToCart(page).scrollIntoViewIfNeeded();
    await addToCart(page).click();

    await expect(cart(page)).toBeVisible();
    await expect
      .poll(async () => (await cart(page).boundingBox())!)
      .toEqual({ x: 0, y: 0, width: await rightEdge(page), height: 844 });
    await expect(close(page)).toBeInViewport({ ratio: 1 });
    await expect(total(page)).toBeInViewport({ ratio: 1 });
    await expect(total(page)).toHaveText("$6,400");
    for (const control of await line(page, "Tjern").getByRole("button").all()) {
      await expect(control).toBeInViewport({ ratio: 1 });
    }
    // Nothing pushes the page wider than the screen.
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
  });

  test("the navigation keeps the cart beside the menu", async ({ page }) => {
    await page.goto("/");

    const banner = page.getByRole("banner");
    await expect(banner.getByRole("button", { name: "Menu" })).toBeVisible();
    await expect(cartButton(page)).toBeVisible();
    await expect(cartButton(page)).toBeInViewport({ ratio: 1 });
    expect((await banner.boundingBox())!.height).toBeLessThanOrEqual(80);
  });
});
