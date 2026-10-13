// Renders the Stills: one of each Timepiece in the Catalogue, arrived and
// lit, and one more of the Hero Timepiece.
//
//   public/stills/hero-timepiece-opening.webp   the opening of the arrival
//                                               act, shown on Home until the
//                                               3D is drawn
//   public/stills/hero-timepiece.webp           the Hero Timepiece arrived,
//                                               shown where there is no 3D
//   public/stills/<slug>.webp                   each other Timepiece arrived
//
//   npm run stills
//
// Each Still is a photograph of the real thing. The script builds the site
// with its studio open: a page that plays Home's 3D acts with any Timepiece,
// in its own Finish. It serves that build, opens each Timepiece's studio in
// a headless browser, waits for the scene and captures the square the camera
// composes the watch in. Rendered from the scene itself, the opening Still
// matches the canvas that replaces it on Home in all but the time on the
// dial.
//
// Like `npm run models` it runs offline, on a developer's machine, and its
// outputs are committed. Run it again whenever the model, its materials, the
// lighting, the camera, the arrival act or a Timepiece's Finish changes. The
// build it leaves in `.next` has the studio open, which the deployed site
// never does; the next `npm run build` closes it again.

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import { HERO_STILL } from "../src/components/three/hero-model.ts";
import { listTimepieces } from "../src/lib/catalogue.ts";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const next = "node_modules/next/dist/bin/next";

// Each Still is this many pixels square: enough for the widest laptop Stage
// on a high-density screen. Next serves smaller copies to smaller screens.
const SIDE = 1600;
const QUALITY = 0.9;
// Two device pixels to each CSS pixel, so the square is half of SIDE on the
// page.
const DENSITY = 2;

// The time on the dial in every Still: eight minutes past ten, the pose that
// shows a dial at its clearest. The live watch shows the Shopper's own time.
const SHOWN_TIME = { hours: 10, minutes: 8, seconds: 37 };

function buildSiteWithStudio() {
  const { status } = spawnSync(process.execPath, [next, "build"], {
    cwd: repo,
    stdio: "inherit",
    env: { ...process.env, TOLVIK_STUDIO: "1" },
  });
  if (status !== 0) throw new Error("The site did not build.");
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function serveBuiltSite() {
  const port = await freePort();
  const url = `http://localhost:${port}`;
  const server = spawn(
    process.execPath,
    [next, "start", "--port", String(port)],
    { cwd: repo, stdio: ["ignore", "ignore", "inherit"] },
  );

  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) break;
    const up = await fetch(url).then(
      (response) => response.ok,
      () => false,
    );
    if (up) return { url, stop: () => server.kill() };
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  server.kill();
  throw new Error("The built site did not start.");
}

/** Captures the camera's square, the largest that fits the Stage. */
async function capture(page, figure) {
  const stage = await figure.boundingBox();
  const side = Math.min(stage.width, stage.height);
  if (side * DENSITY !== SIDE) {
    throw new Error(
      `The Stage's square is ${side * DENSITY}px, expected ${SIDE}px`,
    );
  }
  const png = await page.screenshot({
    clip: {
      x: stage.x + (stage.width - side) / 2,
      y: stage.y + (stage.height - side) / 2,
      width: side,
      height: side,
    },
  });

  // The browser itself encodes the WebP, so the script needs no encoder.
  const webp = await page.evaluate(
    async ({ png, quality }) => {
      const image = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = new OffscreenCanvas(image.width, image.height);
      canvas.getContext("2d").drawImage(image, 0, 0);
      const blob = await canvas.convertToBlob({ type: "image/webp", quality });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      return btoa(
        Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""),
      );
    },
    { png: png.toString("base64"), quality: QUALITY },
  );
  return Buffer.from(webp, "base64");
}

function write(still, bytes) {
  const file = path.join(repo, "public", still);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  const kb = Math.round(bytes.byteLength / 1024);
  console.log(`Wrote public${still} (${SIDE}px square, ${kb} KB)`);
}

/** Photographs one Timepiece in its studio and writes its Stills. */
async function photograph(browser, site, timepiece) {
  // A laptop-wide window. Its Stage is wider than it is tall, so the
  // camera's square is as tall as the Stage; the window is then made
  // exactly tall enough for that square to be the size wanted.
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: DENSITY,
  });
  // The watch reads the hour, minute and second off the page's clock, in
  // `use-clock.ts`. Only those three readings are held: the clock itself
  // must keep running, or the arrival act, which GSAP times by it, would
  // never play.
  await page.addInitScript(({ hours, minutes, seconds }) => {
    Date.prototype.getHours = () => hours;
    Date.prototype.getMinutes = () => minutes;
    Date.prototype.getSeconds = () => seconds;
  }, SHOWN_TIME);
  await page.goto(`${site.url}/studio/${timepiece.slug}`);
  const figure = page.locator('[data-hero-timepiece="ready"]');
  await figure.waitFor({ timeout: 60_000 });
  const stage = await figure.boundingBox();
  await page.setViewportSize({
    width: 1400,
    height: 900 + SIDE / DENSITY - stage.height,
  });

  // Leave only the canvas on the page: no copy over it, no Still under it.
  await page.addStyleTag({
    content: `
      body * { visibility: hidden !important; }
      [data-hero-timepiece] canvas { visibility: visible !important; }
      [data-hero-timepiece] * { opacity: 1 !important; transition: none !important; }
    `,
  });
  // The dial's wordmark is drawn once the display face has loaded.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  // Only Home opens on a Still that the canvas then replaces, and Home
  // shows the Hero Timepiece.
  if (timepiece.isHero) write(HERO_STILL.opening, await capture(page, figure));

  // The arrival act is two Stages long and the Stage holds for it, so one
  // Stage of scrolling plays the act to its end.
  await page.evaluate((y) => window.scrollTo(0, y), SIDE / DENSITY);
  await page.waitForTimeout(2000);
  write(timepiece.stills[0].src, await capture(page, figure));

  await page.close();
}

async function main() {
  buildSiteWithStudio();
  const site = await serveBuiltSite();
  const browser = await chromium.launch();

  try {
    for (const timepiece of await listTimepieces()) {
      await photograph(browser, site, timepiece);
    }
  } finally {
    await browser.close();
    site.stop();
  }
}

await main();
