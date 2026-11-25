# How it works and what informed it

**Fluid UI Design** is a reusable interface, motion, and 3D engineering workflow for coding agents (Codex, Claude Code, Cursor, and Antigravity). It is not a separate component framework or runtime dependency. Its output depends on the host model, the project's existing stack, and whether the optional browser inspection scripts are run.

---

## Why unconstrained models converge on the same three layouts

When an LLM is asked to design a landing page or dashboard without structural constraints, it samples the highest-probability tokens across its web training corpus. In current models, that convergence produces three recurring layouts regardless of the subject:

1. **The warm-editorial template:** A cream background (`~#F4F1EA`), a high-contrast serif headline (`Instrument Serif`) with one random italicized word, and a terracotta or rust accent.
2. **The dark-AI template:** A near-black canvas with purple/cyan glowing radial blobs, an all-caps tracked eyebrow badge (`[ ✨ AI-POWERED ]`), `Geist` or `Space Grotesk`, and three identical 1px-bordered icon cards.
3. **The broadsheet grid:** Hairline 1px rules dividing every block, zero border radius, and decorative monospace indices (`01 / OVERVIEW`, `02 / METRICS`) above every paragraph.

Those patterns are not inherently invalid CSS, which is why static linters rarely catch them. They fail because nothing in them was chosen for the specific subject, and because small engineering defects—matching inner and outer corner radii, sRGB gradients turning gray at the midpoint, `100vh` clipping on mobile Safari, or popovers scaling from `0` at the center of the screen—accumulate across the page.

---

## What the empirical study measured

The direction library (`library/`) and the automated inspector (`scripts/inspect.mjs`) derive from a quantitative study of **247 curated sites** from One Page Love and Awwwards Sites of the Day ([full study methodology and figures](references/research.md)).

Comparing sites scored `>= 7.5` by the evaluation panel against sites scored `< 6.5` established several measurable differences:

| Pattern | Top-scored sites (`>= 7.5`) | Lower-scored sites (`< 6.5`) | Editorial rule in this skill |
| --- | ---: | ---: | --- |
| Icon-topped feature cards | 1% | 28% | Replace with subject-specific section blueprints or live UI fragments |
| Pill badges / eyebrow chips above H1 | 14% | 34% | Put the claim in the heading itself or drop the badge |
| Background or button gradients | 22% | 52% | Use flat tonal steps, authentic media, or explicit `in oklch` atmospheric fields |
| Resting drop shadows on cards | 24% | 48% | Separate surfaces by `oklch()` lightness steps; reserve shadows for floating overlays |
| Tiny tracked uppercase labels | 16% | 57% | Use readable sentence case |
| Hero media covering `>= 50%` of first screen | 68% | 31% | Give the primary visual or interactive fragment dominant scale |
| Median largest display type | `8.4vw` | `5.0vw` | Establish hierarchy through scale contrast (`4.3×`+ headline-to-body ratio) |
| Median headline length | 5 words (`32ch`) | 9+ words | Keep every headline to 2 lines or fewer at every viewport width |

One important caveat from blind testing ([`references/research.md` §11](references/research.md)): stripping ornaments (badges, borders, cards, gradients) without replacing them with substance produces an empty page that human reviewers rate *lower* than a busy page with AI tells. Restraint only wins when paired with large typography, whole fields of color, complete written content, real imagery from the subject's world, and one live interactive element.

---

## What each integrated source contributes

The [design skill coverage](references/design-skill-coverage.md) documents the integrated material and the available specialist lookups. The original foundation combined these sources:

1. **Empirical art direction & automated DOM measurement (`design-taste-frontend` / `tasteskill v2`):**
   `scripts/draw.mjs` prevents model-default convergence by dealing researched compositions, type systems, and section blueprints from the 247-site library. `scripts/lint.mjs` and `scripts/inspect.mjs` measure the rendered DOM in headless Chrome at `1440px`, `768px`, and `390px` (checking headline line counts, outer margin symmetry, blank vertical stretches, contrast, and horizontal overflow).
2. **Cinematic media, hero specs & motion recipes (`motionsites-web-builder`):**
   Provides 40 complete hero/landing specifications (`examples/`), a publicly hosted shelf of 50+ looping videos and 30 transparent cutouts (`media/`), and 58 tested motion recipes (`references/techniques/`), with commercial promotional blocks removed.
3. **Perceptual color science, optical typography & production UX (`references/palettes-and-aesthetics.md`, `references/typography-and-geometry.md`, `references/motion-mobile-and-ux-patterns.md`):**
   Codifies `oklch(L C H)` lightness uniformity, 31 curated 3-color palettes (60% ground, 30% structure, 10% accent), 16 perceptual phenomena (simultaneous contrast, irradiation illusion, Helmholtz–Kohlrausch, Abney, Hunt), 20 historical design eras, 22 non-flat background textures, 10 optical CSS typography fixes, 10 native mobile Safari rules, 22 cognitive UX laws, and production TypeScript/CSS patterns (Amazon Safe Triangles, resilient clipboard copy, optimistic updates with undo, idempotency keys).
4. **Physical motion & accessibility (`apple-design` & `web-interface-guidelines`):**
   Translates Apple's *Designing Fluid Interfaces* (WWDC 2018) and *Principles of Great Design* into web primitives: pointer-down responsiveness, 1:1 drag tracking, mid-flight interruptibility, critically damped springs (`ζ = 1.0`) vs. momentum-projecting flick springs (`ζ = 0.8`), progressive rubber-banding, and Vercel's Web Interface Guidelines for semantic HTML, keyboard focus, and `prefers-reduced-motion`.
5. **67 interface style systems & 3D/WebGL blueprints (`styles/` & `blueprints/`):**
   Includes 67 standalone style guides from `awesome-design-skills` (`styles/`) plus complete reference implementations for Three.js / React Three Fiber (`inside-the-microchip-3d.html`, `animated-book-slider-Book.jsx`, `MeshPortalMaterial`, `react-reverse-portal` shared-element WebGL route transitions, Paper Shaders, Glisse liquid glass, WebGPU fullscreen quad shaders, and pure CSS holographic foil cards).
6. **Faux product UI, bento grids & scripted cursor demos (`stageshow/` & `stageshow/vanilla-runtime/`):**
   Integrates Benji Taylor's `stageshow` skill (`benjitaylor/skills` v1.1.1) and the plain-JS export runtime (`stageshow-js`). Addresses the five ways product-UI illustrations fail (*too much text, wireframe gray blobs, boxed whole-window screenshots, flat equal-weight cards, and bland gray windows*) using a 3–7 word focal string budget, intentional 2/3-stage edge-bleeding crops, the `Stage`/`Act` choreography kit, 69 gold and product-study scenes (`Linear`, `Figma`, `Raycast`, `Finder`, `Slack`, `Dynamic Island`, `AI Chat`, `Bento`), and `stageshow/scripts/film.mjs --gate` multi-frame rehearsal checks.

---

## Scope and verification limits

- **Automated checks vs. visual judgment:** A `0 FAIL` report from `scripts/inspect.mjs` confirms that the page meets structural constraints (no overflow, headlines within two lines, balanced outer margins, sufficient contrast, loaded fonts). It does not prove that the design is aesthetically coherent; the agent must still inspect the captured screenshots against [`references/critique.md`](references/critique.md).
- **Context-dependent rules:** The strict no-ornament house style enforced by `inspect.mjs` is designed for editorial and marketing pages. Application workspaces (dashboards, admin panels, settings, tables) legitimately require quiet structural borders, status badges, and dense controls; use `scripts/draw.mjs --app`, `scripts/inspect.mjs --app`, and [`references/app-screens.md`](references/app-screens.md) for those screens.
- **Asset licensing:** Open-collection images and videos fetched via `scripts/assets.mjs` retain their upstream CC0, Public Domain, CC BY, or CC BY-SA licenses recorded in `assets/credits.json`. Fonts loaded from Fontshare or Google Fonts are open; commercial studio faces (`ABC Diatype`, `TWK Lausanne`, `PP Mori`, `Söhne Mono`, `GT Walsheim`) require the project's own license and self-hosted font files.
