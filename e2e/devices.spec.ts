import { expect, type Page, test } from "@playwright/test";

// What the 3D asks of the device it is drawn on: a phone gets the lighter
// model and fewer pixels, and a device that cannot keep up keeps the Still.

const heroTimepiece = (page: Page) =>
  page.getByRole("img", { name: "The Tjern in brushed steel" });

/** Every model the page fetches, by its file's name. */
function modelsFetched(page: Page) {
  const fetched: string[] = [];
  page.on("request", (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.startsWith("/models/")) fetched.push(pathname.slice(8));
  });
  return fetched;
}

/** How many pixels the canvas draws for each pixel of the page. */
const pixelRatio = (page: Page) =>
  heroTimepiece(page)
    .locator("canvas")
    .evaluate(
      (canvas: HTMLCanvasElement) =>
        canvas.width / canvas.getBoundingClientRect().width,
    );

test.describe("on a phone", () => {
  // A phone's screen, which packs three pixels into each of the page's.
  test.use({
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test("the Hero Timepiece is the lighter model, at one and a half pixels to the page's one", async ({
    page,
  }) => {
    const fetched = modelsFetched(page);
    await page.goto("/");
    await expect(heroTimepiece(page)).toHaveAttribute(
      "data-hero-timepiece",
      "ready",
    );

    expect(fetched).toEqual(["hero-timepiece-phone.glb"]);
    expect(await pixelRatio(page)).toBeCloseTo(1.5, 1);
  });
});

test.describe("on a laptop", () => {
  test.use({ deviceScaleFactor: 3 });

  test("the Hero Timepiece is the full model, at two pixels to the page's one", async ({
    page,
  }) => {
    const fetched = modelsFetched(page);
    await page.goto("/");
    await expect(heroTimepiece(page)).toHaveAttribute(
      "data-hero-timepiece",
      "ready",
    );

    expect(fetched).toEqual(["hero-timepiece.glb"]);
    expect(await pixelRatio(page)).toBeCloseTo(2, 1);
  });
});

test.describe("on a device that cannot hold a steady frame rate", () => {
  test.use({
    viewport: { width: 412, height: 840 },
    isMobile: true,
    hasTouch: true,
  });

  test("the Hero Timepiece stays a Still, and the page stays whole", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // The page is told it is a Shopper's browser, not an automated one, so
      // its frame rate is judged ...
      Object.defineProperty(Navigator.prototype, "webdriver", {
        get: () => false,
      });
      // ... and each frame is made to take a tenth of a second, as on a
      // device far too slow for the scene.
      const ask = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) =>
        ask((time) => {
          const until = performance.now() + 100;
          while (performance.now() < until);
          callback(time);
        });
      // Every state the Hero Timepiece passes through.
      const states: string[] = [];
      Object.assign(window, { heroStates: states });
      new MutationObserver(() => {
        const state = document
          .querySelector("[data-hero-timepiece]")
          ?.getAttribute("data-hero-timepiece");
        if (state && state !== states.at(-1)) states.push(state);
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-hero-timepiece"],
      });
    });
    await page.goto("/");

    const states = () =>
      page.evaluate(
        () => (window as unknown as { heroStates: string[] }).heroStates,
      );
    // The scene loads and is judged behind the Still, then gives way to it.
    await expect
      .poll(states, { timeout: 45_000 })
      .toEqual(["loading", "still"]);
    await expect(heroTimepiece(page).locator("canvas")).toHaveCount(0);
    await expect(heroTimepiece(page).locator("img")).toHaveCSS("opacity", "1");
    await expect(page.getByRole("status")).toHaveText("");

    // With no scene to place them, the parts are named in a line.
    await expect(
      page.getByRole("list", { name: "The seven parts, front to back" }),
    ).toBeAttached();
  });
});
