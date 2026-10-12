import { expect, test } from "@playwright/test";

test("Home shows the Tolvik name as a real text heading", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tolvik");
});
