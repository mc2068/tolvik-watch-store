# Tolvik

A concept storefront for Tolvik, an invented luxury watch brand. Its centrepiece is one watch in real-time 3D: as you scroll, it arrives, turns to show its profile and comes apart into its seven layers, and its hands keep your own local time throughout.

Tolvik does not exist and nothing here is for sale. The checkout is a demo that takes no payment, and every name, price, specification and line of brand history is made up. The site is a portfolio piece by [Mohamed Chakroun](https://github.com/mc2068), built to show what a premium 3D shopping experience can look like.

## What is in it

- **Home**: the watch in three scroll-driven acts (arrival, turn, Exploded View), then the Collection, the craftsmanship behind it, and a close.
- **Collection**: six Timepieces in two Collections.
- **Timepiece page**: each Timepiece with its specifications. The Hero Timepiece is live in 3D there too, with a picker for its six Colourways.
- **Cart**: slides out from the header and is kept in the browser.
- **Demo Checkout**: shipping, a payment step that takes no payment, and a confirmation with an invented order number. No form value is ever sent, logged or stored.
- **Credits**: the artists whose 3D models the site is built on.

There is no backend: the catalogue is sample data read through one module, so a real one could replace it later. See [`docs/adr`](docs/adr) for that decision and for why only one Timepiece is in real-time 3D. The words used throughout are defined in [`CONTEXT.md`](CONTEXT.md).

## Stack

- [Next.js](https://nextjs.org) (App Router), React and TypeScript
- Tailwind CSS
- [React Three Fiber](https://r3f.docs.pmnd.rs) and drei for the 3D scene, on three.js
- [GSAP](https://gsap.com) with ScrollTrigger for every scroll-driven move
- Zustand for the cart
- [glTF Transform](https://gltf-transform.dev) and meshoptimizer to prepare the models offline
- Vitest for unit tests, Playwright for browser tests
- Made to be hosted on Vercel's free tier

## Running it

Node 22.18 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Command | What it does |
| --- | --- |
| `npm run dev` | The site in development |
| `npm run build` | The production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next's route types, then `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright) against the production build. Run `npx playwright install chromium` once first. |
| `npm run models` | Prepares the 3D models in `public/models` from the downloads in `models-raw/` |
| `npm run stills` | Photographs every Still in `public/stills`, and the share image, from the live scene |

The last two run offline on a developer's machine and their outputs are committed. `models-raw/` is not in the repository; it holds the two downloads credited below.

## Credits

The site is built on two 3D models, both licensed under [Creative Commons Attribution 4.0](http://creativecommons.org/licenses/by/4.0/):

- This work is based on "Stainless Steel Wristwatch Analog Watch" (https://sketchfab.com/3d-models/stainless-steel-wristwatch-analog-watch-029a0b692d474e55ac29292fc30fb153) by render-lab (https://sketchfab.com/render-lab) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
- This work is based on "Swiss lever escapement mechanism" (https://sketchfab.com/3d-models/swiss-lever-escapement-mechanism-96cf82a6bdcd4ddda7635fbd33d0e016) by C. Yamahata (https://sketchfab.com/cyamahat) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)

Both were simplified and compressed for the web and given new materials; the watch's three hands were separated so they can tell the time.

Set in Spectral and Schibsted Grotesk, both under the SIL Open Font Licence.

## Rights

Concept site designed and built by Mohamed Chakroun. Copyright © 2026 Mohamed Chakroun. All rights reserved.

The code is public to be read, not reused: no licence is granted to copy, modify or redistribute it. The two 3D models remain under their own licences, above.
