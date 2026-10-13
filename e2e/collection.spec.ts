import { expect, type Page, test } from "@playwright/test";

// Everything Tolvik makes, as the brief sets it out: six Timepieces in two
// Collections, three in each.
const collections = [
  {
    collection: "Kyst",
    timepieces: [
      { name: "Tjern", price: "$6,400" },
      { name: "Skifer", price: "$5,800" },
      { name: "Gran", price: "$6,900" },
    ],
  },
  {
    collection: "Natt",
    timepieces: [
      { name: "Kull", price: "$7,600" },
      { name: "Midnatt", price: "$8,200" },
      { name: "Lyng", price: "$8,900" },
    ],
  },
];

const everyTimepiece = collections.flatMap(({ timepieces }) => timepieces);
const [[, skifer], [kull]] = collections.map(({ timepieces }) => timepieces);

const listed = (page: Page) => page.getByRole("main").getByRole("listitem");

test("the Collection page lists six Timepieces with their prices", async ({
  page,
}) => {
  await page.goto("/collection");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Collection",
  );
  await expect(listed(page)).toHaveCount(6);
  for (const { name, price } of everyTimepiece) {
    const timepiece = listed(page).filter({
      has: page.getByRole("heading", { name, exact: true }),
    });
    await expect(timepiece.getByText(price, { exact: true })).toBeVisible();
  }
});

test("the Collection page groups the Timepieces by Collection", async ({
  page,
}) => {
  await page.goto("/collection");

  for (const { collection, timepieces } of collections) {
    const group = page.getByRole("region", { name: collection });

    await expect(group.getByRole("heading", { level: 2 })).toHaveText(
      collection,
    );
    await expect(group.getByRole("listitem").getByRole("heading")).toHaveText(
      timepieces.map(({ name }) => name),
    );
  }
});

test("every Timepiece on the Collection page is shown in its Still", async ({
  page,
}) => {
  await page.goto("/collection");

  for (const { name } of everyTimepiece) {
    const still = listed(page).getByRole("img", { name: `The ${name} in` });

    await still.scrollIntoViewIfNeeded();
    await expect(still).toBeVisible();
    // The file arrived and decoded: a missing Still has no width of its own.
    await expect
      .poll(() => still.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  }
});

test("the navigation leads to the Collection page", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("banner")
    .getByRole("link", { name: "Collection" })
    .click();

  await expect(page).toHaveURL("/collection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Collection",
  );
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the Collection page fits the screen, with every Timepiece on it", async ({
    page,
  }) => {
    await page.goto("/collection");

    await expect(listed(page)).toHaveCount(6);
    // Nothing pushes the page wider than the screen.
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
  });
});

test("Home shows a selection of the Collection and the way to all of it", async ({
  page,
}) => {
  await page.goto("/");

  const collection = page.getByRole("region", {
    name: "One watch, six ways.",
  });

  // One Timepiece from each Collection, neither of them the Hero Timepiece,
  // which Home has already shown.
  await expect(collection.getByRole("listitem")).toHaveCount(2);
  for (const { name, price } of [skifer, kull]) {
    const timepiece = collection.getByRole("listitem").filter({
      has: page.getByRole("heading", { name, exact: true }),
    });
    await expect(timepiece.getByText(price, { exact: true })).toBeVisible();
    await expect(
      timepiece.getByRole("img", { name: `The ${name} in` }),
    ).toBeVisible();
  }
  await expect(
    collection.getByRole("link", { name: "View the Collection" }),
  ).toHaveAttribute("href", "/collection");
});

test("the studio is closed in the site a Shopper gets", async ({ page }) => {
  const response = await page.goto("/studio/tjern");

  expect(response?.status()).toBe(404);
  await expect(page.locator("canvas")).toHaveCount(0);
});
