import { expect, type Page, test } from "@playwright/test";

const cart = (page: Page) => page.getByRole("dialog", { name: "Your cart" });
const cartButton = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: /^Cart/ });
const addToCart = (page: Page) =>
  page.getByRole("main").getByRole("button", { name: "Add to cart" });
const checkOut = (page: Page) =>
  cart(page).getByRole("link", { name: "Check out" });

// The Demo Checkout's three parts, each with its own heading.
const review = (page: Page) => page.getByRole("region", { name: "Your order" });
const shippingForm = (page: Page) =>
  page.getByRole("form", { name: "Shipping" });
const payment = (page: Page) => page.getByRole("region", { name: "Payment" });
const field = (page: Page, label: string) =>
  shippingForm(page).getByLabel(label, { exact: true });
const continueToPayment = (page: Page) =>
  shippingForm(page).getByRole("button", { name: "Continue to payment" });
const placeOrder = (page: Page) =>
  payment(page).getByRole("button", { name: "Place order" });

// Values no page would ever hold of its own accord, so that finding one
// anywhere means it came from the form.
const shipping = {
  "Full name": "Ingrid Quellmark",
  Email: "ingrid.quellmark@example.org",
  "Street address": "Fjordgata 731",
  "Town or city": "Vesterholm",
  "Postal code": "N-7319",
  Country: "Zembla",
};

async function fillShipping(page: Page) {
  for (const [label, value] of Object.entries(shipping)) {
    await field(page, label).fill(value);
  }
}

/** Puts a Timepiece in the cart from its page and goes to the checkout. */
async function checkOutWith(page: Page, address: string) {
  await page.goto(address);
  await addToCart(page).click();
  await checkOut(page).click();
  await expect(page).toHaveURL("/checkout");
  await expect(shippingForm(page)).toBeVisible();
}

test("a Shopper goes from the Collection to a confirmation", async ({
  page,
}) => {
  await page.goto("/collection");
  await page.getByRole("link", { name: "Skifer", exact: true }).click();
  await addToCart(page).click();
  await page.goto("/collection/tjern");
  await addToCart(page).click();

  await checkOut(page).click();

  // The cart closes behind the Shopper, and the checkout opens on what
  // they are about to order.
  await expect(page).toHaveURL("/checkout");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Checkout");
  await expect(cart(page)).toBeHidden();
  await expect(review(page).getByRole("listitem")).toHaveCount(2);
  await expect(review(page)).toContainText("Skifer");
  await expect(review(page)).toContainText(
    "Deep blue dial, brushed steel bracelet",
  );
  // $5,800 and $6,400.
  await expect(review(page)).toContainText("$12,200");

  await fillShipping(page);
  await continueToPayment(page).click();

  await expect(payment(page)).toBeVisible();
  await expect(payment(page)).toContainText("Demo, no payment taken");
  await expect(payment(page)).toContainText("Ingrid Quellmark");
  await expect(payment(page)).toContainText("Fjordgata 731");
  // Nobody is asked for a card: there is not one field on the page. (Next
  // keeps the pages the Shopper came through, hidden, so only the page in
  // view is counted.)
  await expect(
    page.getByRole("main").locator("input, select, textarea"),
  ).toHaveCount(0);
  for (const words of [/card/i, /expir/i, /security code/i, /cvc|cvv/i]) {
    await expect(page.getByLabel(words)).toHaveCount(0);
  }

  await placeOrder(page).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Thank you, Ingrid.",
  );
  await expect(page.getByRole("main")).toContainText(/TLV-\d{6}/);
  await expect(review(page).getByRole("listitem")).toHaveCount(2);
  await expect(review(page)).toContainText("$12,200");
  // The order is placed, so the cart is empty.
  await expect(cartButton(page)).toHaveAccessibleName("Cart, 0 Timepieces");

  await page
    .getByRole("main")
    .getByRole("link", { name: "View the Collection" })
    .click();
  await expect(page).toHaveURL("/collection");
});

test("opening the checkout with an empty cart sends the Shopper to the Collection", async ({
  page,
}) => {
  await page.goto("/checkout");

  await expect(page).toHaveURL("/collection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Collection",
  );
});

test("a confirmation is kept nowhere: reloading it leads back to the Collection", async ({
  page,
}) => {
  await checkOutWith(page, "/collection/gran");
  await fillShipping(page);
  await continueToPayment(page).click();
  await placeOrder(page).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Thank you, Ingrid.",
  );

  await page.reload();

  await expect(page).toHaveURL("/collection");
});

test("leaving the checkout forgets what was typed there", async ({ page }) => {
  await checkOutWith(page, "/collection/gran");
  await fillShipping(page);

  // Away to Home by the wordmark, and back by the cart.
  await page.getByRole("banner").getByRole("link").first().click();
  await expect(page).toHaveURL("/");
  await cartButton(page).click();
  await checkOut(page).click();

  await expect(shippingForm(page)).toBeVisible();
  for (const label of Object.keys(shipping)) {
    await expect(field(page, label)).toHaveValue("");
  }

  // Nor does the browser's Back bring it back: Next keeps a page the
  // Shopper has left, hidden, to show it again as it was.
  await fillShipping(page);
  await page.getByRole("banner").getByRole("link").first().click();
  await expect(page).toHaveURL("/");
  await page.goBack();

  await expect(page).toHaveURL("/checkout");
  for (const label of Object.keys(shipping)) {
    await expect(field(page, label)).toHaveValue("");
  }
});

test("a second order starts afresh, not on the last one's confirmation", async ({
  page,
}) => {
  await checkOutWith(page, "/collection/gran");
  await fillShipping(page);
  await continueToPayment(page).click();
  await placeOrder(page).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Thank you, Ingrid.",
  );

  await page
    .getByRole("main")
    .getByRole("link", { name: "View the Collection" })
    .click();
  await page.getByRole("link", { name: "Lyng", exact: true }).click();
  await addToCart(page).click();
  await checkOut(page).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Checkout");
  await expect(review(page).getByRole("listitem")).toHaveCount(1);
  await expect(review(page)).toContainText("Lyng");
  await expect(field(page, "Full name")).toHaveValue("");
});

test("missing or invalid fields show clear inline messages", async ({
  page,
}) => {
  await checkOutWith(page, "/collection/lyng");

  // Before the Shopper has tried to go on, nothing is called wrong.
  await expect(field(page, "Full name")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await continueToPayment(page).click();

  // Every field says what it needs, under it, and the keyboard is taken to
  // the first.
  const asked = {
    "Full name": "Enter your full name.",
    Email: "Enter your email address.",
    "Street address": "Enter your street address.",
    "Town or city": "Enter your town or city.",
    "Postal code": "Enter your postal code.",
    Country: "Enter your country.",
  };
  for (const [label, message] of Object.entries(asked)) {
    await expect(field(page, label)).toHaveAttribute("aria-invalid", "true");
    await expect(field(page, label)).toHaveAccessibleDescription(message);
  }
  await expect(field(page, "Full name")).toBeFocused();
  await expect(payment(page)).toHaveCount(0);

  await fillShipping(page);
  await field(page, "Email").fill("ingrid.quellmark");
  await field(page, "Postal code").fill("#7");

  // A field put right says so at once; one still wrong says what is wrong.
  await expect(field(page, "Full name")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(field(page, "Email")).toHaveAccessibleDescription(
    "Enter an email address such as name@example.com.",
  );
  await expect(field(page, "Postal code")).toHaveAccessibleDescription(
    "Enter a postal code of letters and digits.",
  );

  await continueToPayment(page).click();
  await expect(field(page, "Email")).toBeFocused();
  await expect(payment(page)).toHaveCount(0);

  await field(page, "Email").fill(shipping.Email);
  await field(page, "Postal code").fill(shipping["Postal code"]);
  await continueToPayment(page).click();

  await expect(payment(page)).toBeVisible();
});

test("going back from payment keeps what the Shopper typed", async ({
  page,
}) => {
  await checkOutWith(page, "/collection/kull");
  await fillShipping(page);
  await continueToPayment(page).click();

  await payment(page).getByRole("button", { name: "Change" }).click();

  for (const [label, value] of Object.entries(shipping)) {
    await expect(field(page, label)).toHaveValue(value);
  }
});

test("nothing the Shopper types leaves the page, or stays in the browser", async ({
  page,
}) => {
  // Every request the page makes: where to, what it carries, and its headers.
  const requests: Promise<string>[] = [];
  page.on("request", (request) => {
    requests.push(
      request
        .allHeaders()
        .then((headers) =>
          [
            request.url(),
            request.postData() ?? "",
            JSON.stringify(headers),
          ].join("\n"),
        ),
    );
  });

  await checkOutWith(page, "/collection/midnatt");
  await fillShipping(page);
  await continueToPayment(page).click();
  await placeOrder(page).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Thank you, Ingrid.",
  );
  // And on, out of the checkout, as the Shopper would go.
  await page
    .getByRole("main")
    .getByRole("link", { name: "View the Collection" })
    .click();
  await expect(page).toHaveURL("/collection");

  const kept = await page.evaluate(async () => {
    const everything = (storage: Storage) =>
      Object.keys(storage).map((key) => `${key}=${storage.getItem(key)}`);
    return [
      ...everything(localStorage),
      ...everything(sessionStorage),
      document.cookie,
      JSON.stringify(await indexedDB.databases()),
    ].join("\n");
  });

  const sent = await Promise.all(requests);
  expect(sent.length).toBeGreaterThan(0);
  for (const value of Object.values(shipping)) {
    for (const request of sent) expect(request).not.toContain(value);
    for (const encoded of [
      encodeURIComponent(value),
      value.replace(/ /g, "+"),
    ]) {
      for (const request of sent) expect(request).not.toContain(encoded);
    }
    expect(kept).not.toContain(value);
  }
});

test("a Shopper can check out by keyboard alone", async ({ page }) => {
  await page.goto("/collection/skifer");

  await addToCart(page).focus();
  await page.keyboard.press("Enter");
  await expect(cart(page)).toBeVisible();

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

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Thank you, Ingrid.",
  );
});

/** Presses Tab until the keyboard is on this, as a Shopper would. */
async function tabTo(page: Page, target: ReturnType<Page["locator"]>) {
  for (let presses = 0; presses < 40; presses++) {
    if (await target.evaluate((element) => element === document.activeElement))
      return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Tab never came to it");
}

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the checkout fits the screen, from the cart to the confirmation", async ({
    page,
  }) => {
    await page.goto("/collection/tjern");
    await addToCart(page).scrollIntoViewIfNeeded();
    await addToCart(page).click();
    await checkOut(page).click();
    await expect(page).toHaveURL("/checkout");

    // What is ordered comes first, then the form.
    const reviewTop = (await review(page).boundingBox())!.y;
    const formTop = (await shippingForm(page).boundingBox())!.y;
    expect(reviewTop).toBeLessThan(formTop);

    const fits = () =>
      page.evaluate(() => document.documentElement.scrollWidth);

    // What is wrong is said under the field, in view as the keyboard
    // comes to it.
    await continueToPayment(page).click();
    await expect(field(page, "Full name")).toBeFocused();
    await expect(
      shippingForm(page).getByText("Enter your full name."),
    ).toBeInViewport();
    expect(await fits()).toBeLessThanOrEqual(390);

    await fillShipping(page);
    await continueToPayment(page).click();
    await expect(placeOrder(page)).toBeVisible();
    expect(await fits()).toBeLessThanOrEqual(390);

    // Every control is big enough for a thumb.
    for (const control of [
      ...(await review(page).getByRole("button").all()),
      ...(await payment(page).getByRole("button").all()),
    ]) {
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }

    await placeOrder(page).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
    expect(await fits()).toBeLessThanOrEqual(390);
  });
});
