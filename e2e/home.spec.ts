import { expect, type Page, test } from "@playwright/test";

const heroTimepiece = (page: Page) =>
  page.getByRole("img", { name: "The Tolvik watch in steel" });

test("Home opens on the Hero Timepiece, with its headline in real text", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The hour, in steel.",
  );
  await expect(
    page
      .getByRole("region", { name: "The hour, in steel." })
      .getByText("A steel case, a steel bracelet"),
  ).toBeVisible();

  // Drawn as a still until the 3D is ready, then on a canvas.
  await expect(
    heroTimepiece(page).locator("img, canvas").first(),
  ).toBeVisible();
});

test.describe("the arrival act", () => {
  // How much of the headline shows: its own opacity times every ancestor's.
  const headlineOpacity = (page: Page) =>
    page.getByRole("heading", { level: 1 }).evaluate((heading) => {
      let opacity = 1;
      let node: Element | null = heading;
      for (; node; node = node.parentElement) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      return opacity;
    });

  // The act lasts one screen of scrolling; half a screen is well inside it.
  const scrollHalfAScreen = (page: Page) =>
    page.evaluate(() => window.scrollTo(0, window.innerHeight / 2));

  test("gives its copy way to the watch, and back when the Shopper scrolls up", async ({
    page,
  }) => {
    await page.goto("/");
    expect(await headlineOpacity(page)).toBe(1);

    await scrollHalfAScreen(page);
    await expect.poll(() => headlineOpacity(page)).toBe(0);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => headlineOpacity(page)).toBe(1);
  });

  test("holds still for a Shopper who prefers reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await scrollHalfAScreen(page);
    // Long enough for a scroll-driven fade to have started, had there been one.
    await page.waitForTimeout(700);

    expect(await headlineOpacity(page)).toBe(1);
    // The watch is a still image, and no 3D is loaded in its place.
    await expect(heroTimepiece(page).locator("img")).toBeVisible();
    await expect(heroTimepiece(page).locator("canvas")).toHaveCount(0);
  });
});

test("the still returns if the browser drops the 3D scene", async ({
  page,
}) => {
  await page.goto("/");
  const canvas = heroTimepiece(page).locator("canvas");
  await expect(page.getByRole("status")).toHaveText("Drag to look around");

  // What a phone does to a page left in the background: it takes the
  // graphics memory back, and the canvas goes blank.
  await canvas.evaluate((element: HTMLCanvasElement) =>
    element
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context")
      ?.loseContext(),
  );

  await expect(canvas).toHaveCount(0);
  await expect(heroTimepiece(page).locator("img")).toBeVisible();
  await expect(heroTimepiece(page).locator("img")).toHaveCSS("opacity", "1");
});

test.describe("on a touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("a swipe up over the Hero Timepiece still scrolls the page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("status")).toHaveText("Drag to look around");

    // Real touch events, sent through the browser's own gesture handling:
    // a finger put down on the middle of the watch and moved up the screen.
    const canvas = (await page.locator("canvas").boundingBox())!;
    const finger = {
      x: canvas.x + canvas.width / 2,
      y: canvas.y + canvas.height / 2,
    };
    const devtools = await page.context().newCDPSession(page);
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      touchPoints: { x: number; y: number }[],
    ) => devtools.send("Input.dispatchTouchEvent", { type, touchPoints });

    await touch("touchStart", [finger]);
    for (let moved = 20; moved <= 200; moved += 20) {
      await touch("touchMove", [{ x: finger.x, y: finger.y - moved }]);
    }
    await touch("touchEnd", []);

    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100);
  });
});

test("Home states Tolvik's craftsmanship in real text", async ({ page }) => {
  await page.goto("/");

  const craftsmanship = page.getByRole("region", {
    name: "Made to be read in the dark.",
  });
  await expect(craftsmanship.getByRole("heading", { level: 2 })).toHaveText(
    "Made to be read in the dark.",
  );
  for (const principle of [
    "Legibility first",
    "Steel throughout",
    "Built to be opened",
  ]) {
    await expect(
      craftsmanship.getByText(principle, { exact: true }),
    ).toBeVisible();
  }
});

test("Home loads without a console error", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/", { waitUntil: "networkidle" });
  // Not before the 3D scene has loaded and drawn its first frame.
  await expect(page.getByRole("status")).toHaveText("Drag to look around");

  expect(errors).toEqual([]);
});
