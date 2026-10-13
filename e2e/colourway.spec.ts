import { expect, type Page, test } from "@playwright/test";

const picker = (page: Page) => page.getByRole("group", { name: "Colourway" });
const option = (page: Page, name: string) =>
  picker(page).getByRole("radio", { name, exact: true });
const named = (page: Page, colourway: string) =>
  picker(page).getByText(colourway, { exact: true });

// The Hero Timepiece on its page, whichever Colourway it is in.
const heroTimepiece = (page: Page) =>
  page.getByRole("main").getByRole("img", { name: "The Tjern" });

test("choosing a Colourway changes the one that is named", async ({ page }) => {
  await page.goto("/collection/tjern");

  // The Hero Timepiece opens as the Catalogue lists it.
  await expect(
    named(page, "Deep blue dial, brushed steel bracelet"),
  ).toBeVisible();
  await expect(option(page, "Deep blue")).toBeChecked();
  await expect(option(page, "Brushed steel")).toBeChecked();

  await option(page, "Rowan red").check();
  await expect(
    named(page, "Rowan red dial, brushed steel bracelet"),
  ).toBeVisible();

  // The bracelet is chosen apart from the dial, which stays as it was.
  await option(page, "Blackened steel").check();
  await expect(
    named(page, "Rowan red dial, blackened steel bracelet"),
  ).toBeVisible();
  await expect(option(page, "Rowan red")).toBeChecked();
  await expect(option(page, "Deep blue")).not.toBeChecked();
});

test("the picker offers three dial colours and two bracelets", async ({
  page,
}) => {
  await page.goto("/collection/tjern");

  const names = (set: string) =>
    picker(page)
      .getByRole("group", { name: set })
      .getByRole("radio")
      .evaluateAll((radios: HTMLInputElement[]) =>
        radios.map((radio) => radio.labels?.[0].textContent),
      );

  expect(await names("Dial")).toEqual([
    "Deep blue",
    "Glacier blue",
    "Rowan red",
  ]);
  expect(await names("Bracelet")).toEqual(["Brushed steel", "Blackened steel"]);
});

test("a Shopper chooses a Colourway with the keyboard alone", async ({
  page,
}) => {
  await page.goto("/collection/tjern");
  await expect(option(page, "Deep blue")).toBeChecked();

  // Tab reaches the dial that is chosen; the arrow keys move the choice.
  const onTheChosenDial = () =>
    option(page, "Deep blue").evaluate((radio) => radio.matches(":focus"));
  for (let presses = 0; presses < 20 && !(await onTheChosenDial()); presses++) {
    await page.keyboard.press("Tab");
  }
  await expect(option(page, "Deep blue")).toBeFocused();
  // The keyboard's place is shown on the chip, in the site's one focus ring.
  await expect
    .poll(() =>
      option(page, "Deep blue").evaluate(
        (radio: HTMLInputElement) =>
          getComputedStyle(radio.labels![0]).outlineStyle,
      ),
    )
    .toBe("solid");

  await page.keyboard.press("ArrowRight");
  await expect(option(page, "Glacier blue")).toBeChecked();
  await expect(
    named(page, "Glacier blue dial, brushed steel bracelet"),
  ).toBeVisible();

  // One more Tab moves on to the bracelets.
  await page.keyboard.press("Tab");
  await expect(option(page, "Brushed steel")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    named(page, "Glacier blue dial, blackened steel bracelet"),
  ).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(
    named(page, "Glacier blue dial, brushed steel bracelet"),
  ).toBeVisible();
});

test("the Hero Timepiece's page shows it live, in place of its Stills", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/collection/tjern");

  await expect(page.getByRole("status")).toHaveText("Drag to look around");
  await expect(heroTimepiece(page)).toHaveCount(1);
  await expect(heroTimepiece(page).locator("canvas")).toBeVisible();

  // The watch that is drawn is named as the Colourway it is drawn in.
  await expect(heroTimepiece(page)).toHaveAccessibleName(
    "The Tjern in brushed steel, with a deep blue dial",
  );
  await option(page, "Glacier blue").check();
  await option(page, "Blackened steel").check();
  await expect(heroTimepiece(page)).toHaveAccessibleName(
    "The Tjern with a glacier blue dial and a blackened steel bracelet",
  );
  await expect(heroTimepiece(page).locator("canvas")).toBeVisible();

  expect(errors).toEqual([]);
});

test("a Shopper who prefers reduced motion sees each Colourway as a Still", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/collection/tjern");

  const still = heroTimepiece(page).locator("img");
  const shown = () =>
    still.evaluate((image: HTMLImageElement) =>
      image.complete && image.naturalWidth > 0 ? image.currentSrc : "",
    );

  await expect(heroTimepiece(page).locator("canvas")).toHaveCount(0);
  await expect.poll(shown).toContain("hero-timepiece.webp");

  await option(page, "Rowan red").check();
  await expect.poll(shown).toContain("hero-timepiece-rowan-red-brushed-steel");

  await option(page, "Blackened steel").check();
  await expect
    .poll(shown)
    .toContain("hero-timepiece-rowan-red-blackened-steel");
});

test("only the Hero Timepiece has Colourways", async ({ page }) => {
  await page.goto("/collection/skifer");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Skifer");
  await expect(picker(page)).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the watch stays in view while the Shopper chooses its Colourway", async ({
    page,
  }) => {
    await page.goto("/collection/tjern");

    await option(page, "Blackened steel").scrollIntoViewIfNeeded();
    await option(page, "Blackened steel").check();

    await expect(
      named(page, "Deep blue dial, blackened steel bracelet"),
    ).toBeVisible();
    // All of the watch's frame, not an edge of it.
    await expect(heroTimepiece(page)).toBeInViewport({ ratio: 1 });
    await expect(picker(page).getByRole("radio")).toHaveCount(5);
    for (const radio of await picker(page).getByRole("radio").all()) {
      await expect(radio).toBeInViewport();
    }
    // Nothing pushes the page wider than the screen.
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
  });
});
