import { expect, test } from "@playwright/test";

test("Home states Tolvik's craftsmanship in real text", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Made to be read in the dark.",
  );

  const craftsmanship = page.locator("#craftsmanship");
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

  expect(errors).toEqual([]);
});
