import { expect, test } from "@playwright/test";

test("the navigation shows the Tolvik wordmark, which leads Home", async ({
  page,
}) => {
  await page.goto("/");

  const wordmark = page
    .getByRole("banner")
    .getByRole("link", { name: "Tolvik", exact: true });

  await expect(wordmark).toBeVisible();
  await expect(wordmark).toHaveAttribute("href", "/");
});

test("the navigation links lead to the Collection and to Craftsmanship", async ({
  page,
}) => {
  await page.goto("/");

  const navigation = page
    .getByRole("banner")
    .getByRole("navigation", { name: "Main" });

  await expect(
    navigation.getByRole("link", { name: "Collection" }),
  ).toHaveAttribute("href", "/collection");
  await expect(
    navigation.getByRole("link", { name: "Craftsmanship" }),
  ).toHaveAttribute("href", "/#craftsmanship");
});

test("the navigation sits on one line on desktop, no more than 80px tall", async ({
  page,
}) => {
  await page.goto("/");

  const banner = page.getByRole("banner");
  const top = async (name: string) =>
    (await banner.getByRole("link", { name }).boundingBox())?.y;

  expect((await banner.boundingBox())?.height).toBeLessThanOrEqual(80);
  expect(await top("Collection")).toBe(await top("Craftsmanship"));
});

// The second is the Hero Timepiece's page below a laptop's width, where what
// the browser brings into view must also clear the watch's frame.
for (const { where, path, viewport } of [
  { where: "on the Collection", path: "/collection", viewport: undefined },
  {
    where: "on the Hero Timepiece's page at tablet width",
    path: "/collection/tjern",
    viewport: { width: 768, height: 1024 },
  },
]) {
  test.describe(where, () => {
    if (viewport) test.use({ viewport });

    test("the keyboard can come up into the navigation without moving the page", async ({
      page,
    }) => {
      await page.goto(path);

      // Partway down, with the first control in the page focused but left
      // where it is, as the Shopper would have Tabbed to it on the way down.
      await page.evaluate(() => {
        window.scrollTo(0, 400);
        document
          .querySelector<HTMLElement>("main :is(a[href], button, input)")
          ?.focus({ preventScroll: true });
      });
      const scrollY = () => page.evaluate(() => window.scrollY);
      const inBanner = () =>
        page.evaluate(
          () => !!document.activeElement?.closest("body > header"),
        );
      expect(await scrollY()).toBe(400);

      // Up through every control in the header, then back down through
      // them. The header is held at the top, so none of them needs the page
      // to move.
      for (const key of ["Shift+Tab", "Shift+Tab", "Shift+Tab", "Tab", "Tab"]) {
        await page.keyboard.press(key);
        expect(await inBanner()).toBe(true);
        expect(await scrollY()).toBe(400);
      }
    });
  });
}

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the navigation collapses to a menu the Shopper can open and close", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByRole("banner");
    const collection = banner.getByRole("link", { name: "Collection" });
    const craftsmanship = banner.getByRole("link", { name: "Craftsmanship" });

    await expect(banner.getByRole("link", { name: "Tolvik" })).toBeVisible();
    await expect(collection).toBeHidden();

    // By keyboard alone: the menu must not need a pointer.
    const menu = banner.getByRole("button", { name: "Menu" });
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(collection).toBeVisible();
    await expect(craftsmanship).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(collection).toBeHidden();
    await expect(menu).toBeFocused();
    await expect(menu).toHaveCSS("outline-style", "solid");
  });
});
