import { expect, test } from "@playwright/test";

// The pages that exist today. Add each new page here as it is built.
const pages = ["/", "/collection", "/an-address-that-does-not-exist"];

test("an unknown address says so and offers the way back Home", async ({
  page,
}) => {
  const response = await page.goto("/an-address-that-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This page does not exist.",
  );
  await expect(
    page.getByRole("main").getByRole("link", { name: "Return Home" }),
  ).toHaveAttribute("href", "/");
});

for (const path of pages) {
  test(`${path} keeps the dark theme whatever the device prefers`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(path);

    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(8, 10, 13)",
    );
  });

  test(`${path} has no em dash, scroll cue or section counter in its copy`, async ({
    page,
  }) => {
    await page.goto(path);

    const copy = await page.locator("body").innerText();

    expect(copy).not.toMatch(/[—–]/);
    expect(copy).not.toMatch(/scroll/i);
    expect(copy).not.toMatch(/\b\d{1,2}\s*\/\s*\d{1,2}\b/);
  });

  test(`${path} shows a focus ring on every link and button reached by keyboard`, async ({
    page,
  }) => {
    await page.goto(path);

    const controls = await page.locator("a:visible, button:visible").count();
    expect(controls).toBeGreaterThan(0);

    for (let reached = 0; reached < controls; reached++) {
      await page.keyboard.press("Tab");

      const focused = page.locator(":focus");
      await expect(focused).toHaveCSS("outline-style", "solid");
      await expect(focused).toHaveCSS("outline-width", "2px");
    }
  });
}
