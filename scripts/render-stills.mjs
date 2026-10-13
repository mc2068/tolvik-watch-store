// Renders the Stills: three of each Timepiece in the Catalogue, one of each
// view, and more of the Hero Timepiece: its opening, and one from the front
// in each Colourway.
//
//   public/stills/<name>.webp                   from the front: the watch
//                                               arrived and lit
//   public/stills/<name>-profile.webp           in profile, as the turn act
//                                               leaves it
//   public/stills/<name>-exploded.webp          open in the Exploded View
//   public/stills/hero-timepiece-opening.webp   the opening of the arrival
//                                               act, shown on Home until the
//                                               3D is drawn
//   public/stills/hero-timepiece-<colourway>.webp
//                                               from the front, in that
//                                               Colourway
//
// The Catalogue says where each Still goes. The Hero Timepiece's are filed
// under `hero-timepiece`, and Home shows the one from the front where there
// is no 3D. That one is also its default Colourway's.
//
//   npm run stills
//
// Each Still is a photograph of the real thing. The script builds the site
// with its studio open: a page that plays Home's 3D acts with any Timepiece,
// in its own Finish, and another that plays them with the Hero Timepiece in
// any Colourway. It serves that build, opens each studio in turn in
// a headless browser, waits for the scene, scrolls to where the acts hold
// the watch as each view wants it and captures the square the camera
// composes the watch in. Rendered from the scene itself, the opening Still
// matches the canvas that replaces it on Home in all but the time on the
// dial.
//
// Like `npm run models` it runs offline, on a developer's machine, and its
// outputs are committed. Run it again whenever the model, its materials, the
// lighting, the camera, the acts, a Timepiece's Finish or a Colourway
// changes. It ends by
// building the site once more with the studio closed, so the build it leaves
// in `.next` is the one a Shopper gets.

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import { HERO_OPENING_STILL } from "../src/components/three/hero-model.ts";
import { listColourways, listTimepieces } from "../src/lib/catalogue.ts";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = "node_modules/next/dist/bin/next";

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

// Where in the acts each view is photographed: how far through which act,
// the act named by the id of its heading on the page. Each is a moment the
// act holds the watch still. The arrival act has brought it to rest by four
// fifths of the way; the turn act holds its profile from there on; and the
// Exploded View has every part out, and nothing moving, between coming apart
// and closing. Those stretches are set in `pose.ts` and `exploded-view.ts`,
// which Node cannot load: if they move, move these with them.
const VIEWS = {
  front: { heading: "arrival-headline", progress: 1 },
  profile: { heading: "turn-heading", progress: 0.9 },
  exploded: { heading: "exploded-view-heading", progress: 0.57 },
};

/** Builds the site, with the studio open or, as it is deployed, closed. */
function buildSite({ studio }) {
  const { status } = spawnSync(process.execPath, [nextCli, "build"], {
    cwd: repo,
    stdio: "inherit",
    env: { ...process.env, TOLVIK_STUDIO: studio ? "1" : "" },
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
    [nextCli, "start", "--port", String(port)],
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

/**
 * Captures the camera's square, the largest that fits the Stage, once the
 * watch in it has come to rest.
 */
async function capture(page, figure) {
  const stage = await figure.boundingBox();
  const side = Math.min(stage.width, stage.height);
  if (side * DENSITY !== SIDE) {
    throw new Error(
      `The Stage's square is ${side * DENSITY}px, expected ${SIDE}px`,
    );
  }
  const clip = {
    x: stage.x + (stage.width - side) / 2,
    y: stage.y + (stage.height - side) / 2,
    width: side,
    height: side,
  };

  // The act eases the watch into place after the scroll that asked for it,
  // and a browser drawing in software takes its time over each frame. So
  // the square is photographed until three in a row come out alike: with
  // the dial's time held, a watch at rest draws the same frame every time.
  let png;
  for (let alike = 0, attempt = 0; alike < 2; attempt++) {
    if (attempt === 60) throw new Error("The watch never came to rest.");
    await page.waitForTimeout(500);
    const last = png;
    png = await page.screenshot({ clip });
    alike = last && png.equals(last) ? alike + 1 : 0;
  }

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

/**
 * The window to photograph in: laptop-wide, so its Stage is wider than it
 * is tall and the camera's square is as tall as the Stage, and exactly tall
 * enough for that square to be the size wanted. How tall that is depends on
 * what stands above the Stage, so one studio is opened first to measure it.
 *
 * Every photograph is then taken in a window that opens at this size. A
 * window resized with the page already in it would have the acts measured
 * again, and when that falls while the arrival act is still easing the
 * watch into place, the watch is left short of it.
 */
async function fitWindow(browser, site, timepiece) {
  const window = { width: 1400, height: 900 };
  const page = await browser.newPage({ viewport: window });
  await page.goto(`${site.url}/studio/${timepiece.slug}`);
  const stage = await page.locator("[data-hero-timepiece]").boundingBox();
  await page.close();
  return { ...window, height: window.height + SIDE / DENSITY - stage.height };
}

/**
 * Scrolls to where an act is `progress` of the way through. The act is the
 * section its heading names. It ends when the foot of its section reaches
 * the foot of the screen; the arrival act begins at the top of the page, and
 * each of the others as its section comes onto the screen.
 */
function scrollThrough(page, { heading, progress }) {
  return page.evaluate(
    ({ heading, progress }) => {
      const section = document.querySelector(
        `section[aria-labelledby="${heading}"]`,
      );
      if (!section) throw new Error(`No act is headed by #${heading}`);
      const { top, bottom } = section.getBoundingClientRect();
      const ends = bottom + window.scrollY - window.innerHeight;
      const begins = Math.max(0, top + window.scrollY - window.innerHeight);
      window.scrollTo(0, begins + progress * (ends - begins));
    },
    { heading, progress },
  );
}

/**
 * Photographs the watch in the studio at `address` and writes these Stills
 * of it, and with `opening` the Still Home opens on as well.
 */
async function photograph(
  browser,
  site,
  window,
  { address, stills, opening = false },
) {
  const page = await browser.newPage({
    viewport: window,
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
  await page.goto(site.url + address);
  const figure = page.locator('[data-hero-timepiece="ready"]');
  await figure.waitFor({ timeout: 60_000 });

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
  if (opening) write(HERO_OPENING_STILL, await capture(page, figure));

  for (const still of stills) {
    const view = VIEWS[still.view];
    if (!view) throw new Error(`No way to photograph the view "${still.view}"`);
    await scrollThrough(page, view);
    write(still.src, await capture(page, figure));
  }

  await page.close();
}

async function main() {
  buildSite({ studio: true });
  const site = await serveBuiltSite();
  const browser = await chromium.launch();

  try {
    const timepieces = await listTimepieces();
    const window = await fitWindow(browser, site, timepieces[0]);
    const taken = new Set();
    for (const timepiece of timepieces) {
      await photograph(browser, site, window, {
        address: `/studio/${timepiece.slug}`,
        stills: timepiece.stills,
        // Only Home opens on a Still that the canvas then replaces, and
        // Home shows the Hero Timepiece.
        opening: timepiece.isHero,
      });
      for (const { src } of timepiece.stills) taken.add(src);
    }
    // The default Colourway is the Hero Timepiece as it is listed, so its
    // Still has been taken already.
    for (const { slug, still } of await listColourways()) {
      if (taken.has(still.src)) continue;
      await photograph(browser, site, window, {
        address: `/studio/colourway/${slug}`,
        stills: [still],
      });
    }
  } finally {
    await browser.close();
    site.stop();
    buildSite({ studio: false });
  }
}

await main();
