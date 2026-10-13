import { expect, type Page, test } from "@playwright/test";

const listed = (page: Page) => page.getByRole("main").getByRole("listitem");

test("a Shopper opens a Timepiece from the Collection and goes back", async ({
  page,
}) => {
  await page.goto("/collection");

  await listed(page).getByRole("link", { name: "Skifer" }).click();

  await expect(page).toHaveURL("/collection/skifer");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Skifer");
  const main = page.getByRole("main");
  await expect(main.getByText("$5,800", { exact: true })).toBeVisible();
  await expect(
    main.getByText("The quietest Tolvik. Brushed steel with a dial"),
  ).toBeVisible();

  await main.getByRole("link", { name: "The Collection" }).click();

  await expect(page).toHaveURL("/collection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Collection",
  );
});

// Everything Tolvik makes, as the brief sets it out, and where each is found.
const everyTimepiece = [
  { address: "/collection/tjern", name: "Tjern", price: "$6,400" },
  { address: "/collection/skifer", name: "Skifer", price: "$5,800" },
  { address: "/collection/gran", name: "Gran", price: "$6,900" },
  { address: "/collection/kull", name: "Kull", price: "$7,600" },
  { address: "/collection/midnatt", name: "Midnatt", price: "$8,200" },
  { address: "/collection/lyng", name: "Lyng", price: "$8,900" },
];

test("every Timepiece has a page at its own address", async ({ page }) => {
  for (const { address, name, price } of everyTimepiece) {
    const response = await page.goto(address);

    expect(response?.status(), address).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(
      page.getByRole("main").getByText(price, { exact: true }),
    ).toBeVisible();
  }
});

test("a Timepiece's page shows it in several Stills", async ({ page }) => {
  await page.goto("/collection/kull");

  const stills = page.getByRole("main").getByRole("img", { name: "The Kull" });

  await expect(stills).toHaveCount(3);
  for (const still of await stills.all()) {
    await still.scrollIntoViewIfNeeded();
    await expect(still).toBeVisible();
    // The file arrived and decoded: a missing Still has no width of its own.
    await expect
      .poll(() => still.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  }
});

test("a Timepiece's page sets out its specifications in groups", async ({
  page,
}) => {
  await page.goto("/collection/skifer");

  const specifications = page.getByRole("region", { name: "Specifications" });
  const group = (name: string) =>
    specifications.getByRole("group", { name, exact: true });

  await expect(specifications.getByRole("group")).toHaveCount(3);
  await expect(group("The case").getByRole("term")).toHaveText([
    "Case",
    "Crystal",
    "Water resistance",
  ]);
  await expect(group("The case").getByRole("definition")).toHaveText([
    "40 mm brushed steel, 11 mm deep",
    "Domed sapphire, anti-reflective on the inside",
    "100 metres",
  ]);
  await expect(group("The movement").getByRole("term")).toHaveText([
    "Movement",
    "Power reserve",
  ]);
  await expect(group("The movement").getByRole("definition")).toHaveText([
    "Automatic, calibre T12, 28,800 beats an hour",
    "60 hours",
  ]);
  await expect(group("The dial and bracelet").getByRole("term")).toHaveText([
    "Dial",
    "Bracelet",
  ]);
  await expect(
    group("The dial and bracelet").getByRole("definition"),
  ).toHaveText([
    "Slate grey, with luminous batons and hands",
    "Brushed steel links with a folding clasp",
  ]);
});

test("each Timepiece's page has its own title and description", async ({
  page,
}) => {
  await page.goto("/collection/skifer");
  await expect(page).toHaveTitle("Skifer | Tolvik");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "The quietest Tolvik. Brushed steel with a dial the grey of split slate.",
  );

  await page.goto("/collection/kull");
  await expect(page).toHaveTitle("Kull | Tolvik");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Black on black. Blackened steel with a coal dial, so that only the hands and batons show.",
  );
});

test("an address with no Timepiece says so and leads back to the Collection", async ({
  page,
}) => {
  const response = await page.goto("/collection/a-watch-tolvik-never-made");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tolvik makes no such Timepiece.",
  );

  await page
    .getByRole("main")
    .getByRole("link", { name: "Return to the Collection" })
    .click();

  await expect(page).toHaveURL("/collection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Collection",
  );
});

test("Home's Exploded View leads to the Hero Timepiece's page", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("region", { name: "Built in seven layers." })
    .getByRole("link", { name: "View the Timepiece" })
    .click();

  await expect(page).toHaveURL("/collection/tjern");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tjern");
  // The price Home gave is the one its page gives: both ask the Catalogue.
  await expect(
    page.getByRole("main").getByText("$6,400", { exact: true }),
  ).toBeVisible();
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a Timepiece's page fits the screen, with all of it there", async ({
    page,
  }) => {
    await page.goto("/collection/midnatt");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Midnatt");
    await expect(
      page.getByRole("main").getByRole("img", { name: "The Midnatt" }),
    ).toHaveCount(3);
    await expect(page.getByRole("term")).toHaveCount(7);
    // Nothing pushes the page wider than the screen.
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
  });
});
