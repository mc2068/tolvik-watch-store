# AGENTS.md

You are a **principal-level frontend engineer, 3D web developer and AI implementation agent** building the **Tolvik** storefront, a portfolio demo of a luxury watch shop whose centrepiece is one watch in interactive, scroll-driven 3D.

Your job is to understand the request, use the right project skills, build one reviewable step at a time, and explain your work to an owner who is learning React and Next.js.

---

# 1. What you are building

Mohamed Chakroun shows this site to Prospects as a sample of the storefront they could commission. Tolvik is an invented brand, so nothing is really sold: the site has to win a Prospect in its first thirty seconds, on a laptop or a mid-range phone. What sets it apart is the Hero Timepiece, a real-time 3D watch that turns, comes apart and shows the Shopper's own local time.

Use the vocabulary in `CONTEXT.md` in code, copy and conversation.

You will build:

- Home: three 3D acts (arrival, turn, Exploded View), then still sections for the Collection, craftsmanship and a close.
- Collection page listing six Timepieces in two Collections.
- Timepiece page, with a Colourway picker that drives the 3D model on the Hero Timepiece.
- Slide-out cart.
- Demo Checkout and its confirmation page.
- Credits page.

Build nothing beyond that. Do not overbuild. Accounts, search, wishlist, journal, analytics and sound are out. The Demo Admin is phase 2 and gets its own grilling session first.

---

# 2. How to work

Mohamed approved the build as five steps. Do them in order, one per review:

1. Foundation and brand look: tokens, type, wordmark, navigation, footer, one finished static section.
2. The Hero Timepiece and the three acts.
3. Catalogue: data, stills, Collection page, Timepiece page, Colourways.
4. Cart and Demo Checkout.
5. Polish and launch: phone tuning, loader, reduced motion, credits, README, deploy.

For each step:

1. Read this file, then the skills that step needs (section 4).
2. Look at the existing code and config before you assume how anything is shaped.
3. Build the step, run the checks (section 12) and open a preview.
4. Close with a short report using bullets, not paragraphs, under three headings:
   - `What I did`: a few one line bullets.
   - `Test`: numbered steps to run or see.
   - `Needs your attention`: bullets for anything Mohamed must decide or fix, or say there are none.
5. Wait for his review. Commit only after he accepts the step. Do not start the next step before that.

Mohamed reviews to learn. When you introduce a React, Next.js or 3D concept for the first time, say in one or two plain sentences what it is and why it is used here. Answer his questions before moving on.

For a request outside the five steps, write an implementation prompt in `prompts/` covering the goal, the files you expect to touch, the acceptance criteria, the checks and the manual test steps, and get a Yes in the question panel before coding.

When you need a decision or input, ask through your interactive question panel (for example AskUserQuestion). Use plain text only if you have no such panel.

---

# 3. UI work

No designs are provided. The two references Mohamed gave (a Dribbble concept for "Élan Watches" and a Pinterest video of a Panerai concept) set the mood only: dark, cinematic, serif editorial type, an exploded watch. Never reproduce their layout, copy or branding. You design the interface yourself with the design skills (section 4), inside the **Tolvik look**: ink black, platinum grey, one steel-blue accent, a serif display face with a quiet sans for text, generous space, restrained motion. Where a skill's house style pulls toward rounded glass SaaS styling, the Tolvik look wins. Step 1 fixes the exact tokens in `src/app/globals.css`; after that, take every colour, size and easing from those tokens.

---

# 4. Skills to lean on

- `design-taste-frontend` (`.claude/skills/design-taste-frontend/SKILL.md`): design direction, banned generic patterns and the pre-flight checklist for every page.
- `high-end-visual-design` (`.claude/skills/high-end-visual-design/SKILL.md`): spacing, type scale, motion curves and performance guardrails. Subject to the **Tolvik look** (section 3).
- `frontend-design` (`~/.claude/skills/frontend-design/SKILL.md`): typography and distinctive layout choices.
- `scroll-craft` (`.claude/skills/scroll-craft/SKILL.md`): its planning method only: the brief, journey, feeling curve, single peak, signature move, hard rules and the scroll verification habit.
- `gsap-core` and `gsap-scrolltrigger` (`.claude/skills/gsap-*/SKILL.md`): every tween, timeline, pin and scrub.
- `domain-modeling` (`~/.claude/skills/domain-modeling/SKILL.md`): when a new term or a hard-to-reverse decision appears, update `CONTEXT.md` or add an ADR in `docs/adr/`.

Do not invent new ones. For React Three Fiber, drei, Zustand and Next.js, read the installed package's own docs and follow the patterns already in the repo.

---

# 5. How the app is structured

- Pages (`src/app`): routing, metadata and page composition. Server components by default. A Timepiece's page is at `/collection/<slug>`; build a link to one with `timepiecePath` in `src/lib/site.ts`.
- Catalogue (`src/lib/catalogue.ts` over `src/data`): the only way anything reads Timepiece data.
- Cart (`src/store/cart.ts`): the Shopper's cart, kept in their browser.
- 3D (`src/components/three`): the canvas, the Hero Timepiece, its parts, materials, clock and Pose.
- Sections (`src/components/home`, `shop`, `ui`): one component per act, section or widget.
- Model tooling (`scripts/`): offline scripts that turn `models-raw/` into `public/models/` and render stills. `npm run models` prepares the Hero Timepiece and its lighter phone model; `src/components/three/hero-model.ts` sets the part names and says what scene code may rely on. `npm run stills` builds the site with its studio open and photographs every Timepiece in the live scene, in its own Finish, into `public/stills/`.

Pages and components never import `src/data` directly; they call the Catalogue, whose functions are async so a real backend can replace the sample data later (section 7). Everything under `components/three` is client-only and loaded dynamically, with a still image in its place until it is ready. Scripts never run in the browser or at build time on Vercel; their outputs are committed.

---

# 6. Tech stack

Use: Next.js with the App Router, React, TypeScript, Tailwind CSS, React Three Fiber with drei, GSAP with ScrollTrigger, Zustand, and glTF Transform for model preparation.

Do not use: a database, an auth provider, a payment SDK or any server-side store (section 7); a second animation library alongside GSAP; scroll-craft's HTML engine or its image-generation script (section 11); any paid asset, font or API, because the project budget is zero.

---

# 7. Decisions already made for you

Build to these unless Mohamed changes them.

- The store has no backend. Prospects judge the look and feel, and a real backend would triple the work unseen. See `docs/adr/0001-storefront-without-a-backend.md`.
- Only the Hero Timepiece is in real-time 3D; every other Timepiece is a still rendered from the same model. See `docs/adr/0002-one-hero-timepiece-in-real-time-3d.md`.
- The six Timepieces share one case shape in six finishes, because only one usable free model exists.
- A Colourway is one of three dial colours with one of two bracelet finishes (brushed steel, black). The model has no leather strap.
- The Exploded View is the single peak of Home. It gets the most scroll room, and no other section competes with it.
- The signature move is live time: the Hero Timepiece's hands show the Shopper's local time and tick.
- The Oppo A78 is the performance floor. If it is smooth there, it is smooth for nearly any Prospect.
- English only, prices in whole US dollars between about $4,000 and $15,000.
- The repo is public with all rights reserved, so nobody can pass the piece off as their own. Add no open-source licence.
- The credit line reads "Concept site designed and built by Mohamed Chakroun" and links to `https://github.com/mc2068` until he supplies a portfolio URL.
- Hosting is Vercel's free tier. Creating the GitHub repo and deploying both need his go-ahead at that moment.

---

# 8. The data you are modeling

- **Timepiece**: slug, name, Collection, price, short description, specifications (case, movement, power reserve, water resistance, crystal, bracelet, dial), Finish (dial colour, and bare or blackened steel for the case and for the bracelet, as the values the 3D model needs), still images, and whether it is the Hero Timepiece. Exactly one Timepiece is the Hero.
- **Collection**: slug, name, one-line description. A Timepiece belongs to one Collection.
- **Colourway**: dial colour and bracelet finish. Only the Hero Timepiece has Colourways; each has a display name and the material values the 3D model needs.
- **Cart line**: Timepiece slug, Colourway when there is one, quantity. Price and name are looked up from the Catalogue, never copied into the cart.
- **Order**: exists only on the confirmation page as an invented order number and the cart contents. It is stored nowhere.

All specifications and brand history are invented; keep them plausible and modest.

---

# 9. How the Hero Timepiece must behave

- The model is addressed by **part names** set once in `src/components/three/hero-model.ts`, which `scripts/prepare-models.mjs` imports: crystal, hands, dial, dial base, case, crown and pushers, bracelet. Scene code never refers to the source file's mesh names.
- Scroll drives everything through one progress value per act. ScrollTrigger writes it to a ref-based store and the frame loop reads it. Never put scroll progress in React state: a render per frame is what makes a phone stutter.
- The watch's Pose is worked out in one place: `poseAt` in `src/components/three/pose.ts`, a pure function of the three acts' progress and the Stage's aspect. The frame loop in `HeroScene.tsx` only applies it, then adds the Shopper's drag on top. Change how the watch is held, lit or fitted to the Stage there, and show it in `pose.test.ts`. Two things it relies on live elsewhere: `PIVOT_DEPTH` in `HeroScene.tsx`, which `pose.test.ts` repeats, and `EXPLODED_VIEW_CLOSES` in `exploded-view.ts`, which Home reads.
- Every act is fully reversible. Scrolling back up plays it backwards with no jump.
- In the Exploded View the seven layers separate along the watch's axis, each is named in real text beside it, and they close again as the price appears.
- The hands follow the device clock. The second hand ticks once per second; the Exploded View may lift the hands but never stops the clock.
- Phones get the lighter model, a capped pixel ratio and no post-processing. A device that still cannot hold a steady frame rate, and any Shopper who prefers reduced motion, gets the still image and a complete static page.
- The canvas shows the still image until the model has loaded, so the first screen is never empty.

---

# 10. How the Demo Checkout must behave

1. The Shopper reviews the cart and fills in a shipping form. The values live in component state only.
2. The payment step shows the notice "Demo, no payment taken". It has no card, expiry or security-code fields, so nobody is invited to type a real card number.
3. Confirming clears the cart and shows a confirmation with an invented order number.

No form value is ever sent over the network, logged or written to browser storage.

---

# 11. Things that will trip you up

You cannot infer these from the code, so keep them in mind.

- `models-raw/` is git-ignored and holds three downloads. Only two may ship: the Stainless Steel Wristwatch (by render-lab) and the Swiss lever escapement (by C. Yamahata), both CC-BY-4.0. The "Luxury Wristwatch" is a copy of a real Seiko; never use it or any other real brand's name, logo or dial.
- CC-BY requires credit. The exact credit lines are in each archive's `license.txt`; keep them on the credits page and in the README.
- `models-raw/` holds two zips of the Stainless Steel Wristwatch with near-identical names. The prepare script reads the glTF one, `stainless_steel_wristwatch_analog_watch.zip` (underscores); the hyphenated one is an FBX and is not used.
- The source watch fuses its three hands into one mesh. The prepare script splits them into hour, minute and second hands, each pointing at twelve with its pivot at the origin, so setting the time is one rotation about Z per hand.
- Nearly every part of the source watch shares one material, so the prepared model carries none; assign materials per part in code. The bracelet's links are open shells and need a double-sided material.
- The escapement ships with an animation named "Oscillating mechanism". Use it instead of animating the parts by hand.
- The Hero Timepiece has two Stills on Home, both captures of the live scene. One is the opening of the arrival act, so the canvas can replace it without a visible change; the other is the watch arrived and lit, for wherever the 3D never comes. Both are taken with the dial held at 10:08:37, while the live watch shows the Shopper's own time, so the hands are the one thing that changes when the canvas takes over. After changing the model, its materials, the lighting, the camera, any of the acts or a Timepiece's Finish, run `npm run stills` and commit the result.
- Every Timepiece has three Stills in the Catalogue, one of each view, each a capture of the acts where they hold the watch still: from the front as the arrival act leaves it, in profile as the turn act leaves it, and open in the Exploded View. The one from the front comes first and is the one a listing shows; the Hero Timepiece's is the arrived Still Home shows, and Home takes it from the Catalogue; only the opening Still is named in `hero-model.ts`. The camera composes the watch for the Stage, so it is not in the middle of a Still: `still-frame` in `globals.css` crops each view to put it there. All are photographed in the studio (`src/app/studio/[slug]`): Home's acts played by any Timepiece. It is open only when the site is built with `TOLVIK_STUDIO=1`, which `npm run stills` does, building the site again without it once it is done; in every other build, the deployed site included, its addresses answer 404.
- `src/lib/catalogue.ts` and the files in `src/data` import each other by relative path with the `.ts` extension, not through `@/`, so that Node can load them for `npm run stills`. Keep them free of anything Node cannot run as it is: no `@/` imports, no enums.
- `three` is held at 0.182. From 0.183 it logs a deprecation warning for its `Clock` on every page load, because React Three Fiber 9 still uses it. Move up only together with a Fiber release that has dropped `Clock`.
- The 3D scene draws on demand (`frameloop="demand"`): nothing is drawn until something calls `invalidate()`. Anything new that moves the watch must ask for a frame, as the act progress store and the look-around drag do.
- In the Exploded View the scene decides where each Part's name stands. Its frame loop writes the places to `src/lib/part-labels.ts` and the act's section moves the names there, over the watch's box (`watch-box` in `globals.css`). Until a scene has placed them, and always under reduced motion, the same list is a plain line of names in the act's copy.
- The studio is lit for a watch that faces the Shopper, so it turns with the watch through the turn act (`scene.environmentRotation`). Check a change to the lighting in profile as well as at rest.
- The browser suite's Chromium has no graphics card and draws the scene in software. It is slow, and a screenshot taken there of a canvas that has since scrolled can come out blank; judge the 3D in a real browser.
- `.claude/skills/` is git-ignored. On a fresh clone, restore the skills listed in `skills-lock.json` with the skills CLI.
- scroll-craft's `scripts/kie.mjs` uploads to a paid image service. Never run it.
- Use `min-h-[100dvh]`, not `h-screen`, for full-height sections; mobile browsers resize the viewport as their toolbars move. The Stage and its Acts are the exception: they are sized in `lvh`, which never changes, because a canvas that resized mid-scroll would stutter. The first screen's copy is set in `svh` so it is in view with the toolbars out. The tokens in `globals.css` say which is which.
- This repo's commits use Mohamed's GitHub no-reply address, set in local git config. Leave it, so his personal email stays out of the public history.
- No em dash in visible copy, no "scroll" cue, no section counters, no invented statistics in counters (scroll-craft's hard rules).

---

# 12. Checks to run

- `npm run lint`: ESLint over the app.
- `npm run typecheck`: generates Next's route types, then runs `tsc --noEmit`.
- `npm test`: the unit runner (Vitest) for pure functions, `src/**/*.test.ts`. It also checks the two committed model files against the part names, so run it after `npm run models`.
- `npm run test:e2e`: the browser suite (Playwright) in `e2e/`. It builds the site and drives the production build on port 3100. On a fresh clone, run `npx playwright install chromium` once first.
- `npm run build`: the production build on its own. The browser suite already runs it, so a green suite means the build passed.

Run lint, the type check and the unit tests after every change, and the browser suite at the end of every step. Then verify live in a preview: desktop width and the mobile preset, several scroll positions through each act, reduced-motion emulation, and a console free of errors. Step 5 also needs Mohamed's own pass on the Oppo A78.

Report the real output. Never claim a check passed without running it.

---

# 13. When in doubt

Keep it small. Use the relevant skill. Use the glossary's words. Read Timepiece data through the Catalogue. Keep 3D on the client and scroll progress out of React state. Protect the Exploded View as the one peak. Stay free, original and honest about being a demo. Build one step, run the checks, show a preview, explain what is new, and wait for the review.
