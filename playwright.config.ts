import { defineConfig, devices } from "@playwright/test";

// A port of its own, so the suite never collides with `npm run dev` on 3000.
const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  // The test browser has no graphics card, so it draws the Hero Timepiece in
  // software, slowly, and several tests do so at once. Anything that waits
  // on the 3D scene needs longer than the default five seconds, and a test
  // that waits on it more than once needs longer than the default thirty.
  expect: { timeout: 20_000 },
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // The suite drives the production build, the same thing a Shopper gets.
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
