import { expect, test } from "@playwright/test";

test("the footer credits Mohamed and links to him", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");

  await expect(footer).toContainText(
    "Concept site designed and built by Mohamed Chakroun",
  );
  await expect(
    footer.getByRole("link", { name: "Mohamed Chakroun" }),
  ).toHaveAttribute("href", "https://github.com/mc2068");
});
