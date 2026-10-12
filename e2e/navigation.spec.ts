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

    await banner.getByRole("button", { name: "Menu" }).click();
    await expect(collection).toBeVisible();
    await expect(craftsmanship).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(collection).toBeHidden();
    await expect(banner.getByRole("button", { name: "Menu" })).toBeFocused();
  });
});
