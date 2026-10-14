import { expect, test } from "@playwright/test";

test("the credits page names both model artists and links their work", async ({
  page,
}) => {
  await page.goto("/credits");

  const models = page.getByRole("region", { name: "The 3D models" });

  await expect(
    models.getByRole("link", { name: "render-lab" }),
  ).toHaveAttribute("href", "https://sketchfab.com/render-lab");
  await expect(
    models.getByRole("link", { name: "C. Yamahata" }),
  ).toHaveAttribute("href", "https://sketchfab.com/cyamahat");
  await expect(
    models.getByRole("link", { name: "CC-BY-4.0" }).first(),
  ).toHaveAttribute("href", "http://creativecommons.org/licenses/by/4.0/");
});

test("the credits page says Tolvik is fictional and nothing is for sale", async ({
  page,
}) => {
  await page.goto("/credits");

  const main = page.getByRole("main");

  await expect(main).toContainText("Tolvik is a fictional brand");
  await expect(main).toContainText("Nothing here is for sale");
});

test("the footer links to the credits page", async ({ page }) => {
  await page.goto("/collection");

  await page.getByRole("contentinfo").getByRole("link", { name: "Credits" }).click();

  await expect(page).toHaveURL("/credits");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Credits");
});

// What a link shows when it is shared: every page has its own title and
// description, and the share preview image is served.
for (const path of ["/", "/collection", "/collection/tjern", "/checkout", "/credits"]) {
  test(`${path} has a share preview`, async ({ page, request }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });

    const meta = (key: string) =>
      page.locator(`meta[property="${key}"], meta[name="${key}"]`).first();

    await expect(meta("og:title")).toHaveAttribute("content", /Tolvik/);
    await expect(meta("og:description")).toHaveAttribute("content", /\S/);
    await expect(meta("twitter:card")).toHaveAttribute(
      "content",
      "summary_large_image",
    );

    // The address is absolute, made for wherever the site is deployed, so
    // only its path is asked of the server under test.
    const image = await meta("og:image").getAttribute("content");
    const response = await request.get(new URL(image!).pathname);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toBe("image/jpeg");
  });
}
