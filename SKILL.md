---
name: fluid-ui-design
description: >-
  Studio-grade web, UI/UX, motion, and 3D design skill. Enforces OKLCH color science, concentric
  geometry, optical typography, Apple fluid spring physics, native mobile CSS, cognitive UX laws,
  WebGL/3D shader architectures, and real-browser anti-slop verification. Combines an empirical
  library of 247 studied gallery sites, 67 interface style systems, 40 full hero/page prompts,
  74 motion and shader recipes, 31 curated 3-color palettes, and 20 historical aesthetics. Use
  whenever designing, building, refactoring, or auditing any website, landing page, dashboard,
  web app, or interactive 3D experience.
license: MIT
metadata:
  version: "2.1.0"
---

# Fluid UI Design

A page generated without structural constraints converges on the statistical average of its training data: a centered three-line headline with one italicized word, a small pill badge above it, three bordered icon cards, a muddy sRGB gradient, and `Inter` or `Geist` paired with decorative monospace numbers.

This skill replaces defaults with concrete engineering and art-direction decisions, backed by an empirical library of **247 studied gallery sites**, **67 complete interface design systems**, **40 production hero/page blueprints**, **74 motion and WebGL/3D recipes**, and a real-browser inspection gate.

---

## 1. Anti-AI-Slop Rules (Eliminate on Sight)

Unless an existing brand specification explicitly mandates them, strip these patterns immediately:

- **Banned default fonts:** Do not use `Geist`, `Space Grotesk`, `Bricolage Grotesque`, `Instrument Sans`, `Instrument Serif`, or `JetBrains Mono`.
- **Approved sans-serif faces:** `Switzer`, `ABC Diatype`, `TWK Lausanne`, `PP Mori`, `Aeonik`, `Degular`, `GT Walsheim`, `Circular`, `Apfel Grotesk`, `Aktiv Grotesk`, `ABC Favorit`, `Familjen Grotesk`, `ABC Monument Grotesk`, `ABC Oracle`, `Studio Feixen Sans`, `Strichpunkt Sans`, `Arial`.
- **Approved monospace faces (numbers, prices, timestamps, and real code only):** `IBM Plex Mono`, `ABC Diatype Mono`, `Söhne Mono`, `GT America Mono`, `Commit Mono`, `Departure Mono`. Always pair with `font-variant-numeric: tabular-nums`.
- **No decorative eyebrows or index numbers:** Remove `[ 01 / OVERVIEW ]`, fake code breadcrumbs, sparkle icons (`✨`), and all-caps tracked subtitles above every heading.
- **No random italicized or gradient-colored words** inside headlines, and **no periods at the end of display titles**.
- **No container-inside-container border clutter:** Group related content with spatial proximity (`gap-outer >= 2 * gap-inner`) and tonal surface steps rather than 1px divider lines and bordered boxes everywhere.
- **Show the product:** Replace fake gray dashboard skeleton bars and abstract blobs with a live interactive HTML fragment (`data-ui`), a 3D/shader canvas, or authentic photography.

Full 21-point refactoring checklist: [`references/typography-and-geometry.md`](references/typography-and-geometry.md#4-indicators-of-ai-slop--the-21-point-refactoring-protocol).

---

## 2. Surface Geometry, Borders & Blending

1. **Concentric corner radii:** Nested rounded corners must never share the same radius. Compute `r_inner = max(4px, r_outer - padding)` so both arcs share one geometric center. Use continuous corners (`corner-shape: squircle` or SVG superellipse) on focal hardware cards and app icons.
2. **Alpha borders over solid hex:** Solid hex borders clash across changing backgrounds. Use translucent borders (`oklch(1 0 0 / 0.09)` in dark mode, `oklch(0 0 0 / 0.08)` in light mode) plus a `1px` top specular highlight (`oklch(1 0 0 / 0.20)`) on raised dark panels.
3. **Dark-mode depth via surface lightness:** Drop shadows barely register on dark grounds. Step elevation upward in `oklch()` lightness (`L = 0.14` canvas → `0.18` card → `0.22` raised well → `0.26` floating menu).
4. **Match icon stroke to font weight:** Thin `1px` icons look fragile inside bold cards. Scale SVG `stroke-width` with adjacent typography (`1.5px` for regular `400`, `1.75px–2.0px` for medium/semibold `500–600`, `2.25px` for bold `700`).
5. **Fade carousels with a CSS mask:** Apply `mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)` so horizontal rails dissolve cleanly instead of clipping hard.
6. **Knock out white product backgrounds:** On stone, cream, or tinted cards, set `mix-blend-mode: multiply` on white-background product JPEGs so the white box disappears.

---

## 3. Color Science (`OKLCH`, 60–30–10 & 31 Curated Palettes)

- **Use `oklch(L C H)` instead of `hsl()`:** Equal lightness numbers in `oklch` produce equal perceived brightness across every hue.
- **Save muddy gradients:** Standard sRGB gradients dip through a desaturated gray dead-zone in the middle. Interpolate `linear-gradient(135deg in oklch, ...)` or add an explicit high-chroma OKLCH midpoint stop.
- **60% Ground / 30% Secondary Structure / 10% Loud Accent:** Pick two calm colors that get along, and a third that demands attention (*Kyoto Vermillion*, *Basalt Glacier*, *Velvet Plum*, *Standing Ovation*, *Dusky Morpho*, *Regatta Sun*, *Kintsugi Bowl*, *Five-Figure Obsidian*, *Hired The Studio*, etc.).
- **Resolve chroma competition:** If two colors fight for attention (purple vs. cyan, bright blue vs. sun yellow, loud orange vs. product), lower the chroma (`C`) or deepen lightness (`L`) on the supporting tone so the hero accent glows.
- **Temperature counterpoint:** Pair warm beige grounds with a cool accent; pair cool stone grounds with a warm accent. Source the accent directly from the product's material, paint, fabric, or light.
- **Perceptual compensation:** Account for simultaneous contrast, the irradiation illusion (soften pure white text on black to `oklch(0.94 0.008 260)`), the Helmholtz–Kohlrausch effect, Abney effect, Hunt effect, Stevens's power law, and chromostereopsis.

All 31 studio palettes, 16 perceptual phenomena, 20 historical art-direction eras (*Y2K Sony, Mexico '68, Patrick Nagel, NASA '75, Dieter Rams Braun, Googie, VHS, Dark Deco, Jet Age, Koichi Sato, Y2K Clear Plastic, Roland-Garros, Vintage Matchbooks, Mission Control, One-Color Perfume, Italian Futurism, Swiss Annual Reports, 50s Fortune, Moody Corporate Futurism, Psychedelic Pop*), and 22 non-flat background textures: [`references/palettes-and-aesthetics.md`](references/palettes-and-aesthetics.md).

---

## 4. Ten Optical Typography Rules

1. **Reserve bold width on tabs/links** (`::after { content: attr(data-text); font-weight: 700; height: 0; visibility: hidden; }`) so active state changes never cause horizontal layout shift.
2. **Optical vertical centering:** Use `text-box-trim: trim-both; text-box-edge: cap alphabetic;` so descender space (`g`, `y`, `p`) does not push button and badge labels above center.
3. **Protect descenders from underlines:** Set `text-underline-offset: 0.18em` and `text-decoration-skip-ink: auto`.
4. **Lock `<sub>` and `<sup>` line-height:** Set `line-height: 0; position: relative; vertical-align: baseline;` so inline subscripts/superscripts never pry open row spacing.
5. **Scale headlines with `clamp()`** instead of jumping sizes at breakpoints; keep headlines to **2 lines or fewer** (`~32ch` max) with `text-wrap: balance`.
6. **Tame loud acronyms** in running prose using `font-variant-caps: all-small-caps`.
7. **Use true typographic quotes and ellipses:** `“ ”` / `‘ ’` (English) or `« »` (Norwegian), `…` instead of `...`, and non-breaking spaces (`100&nbsp;MB`, `⌘&nbsp;K`).
8. **Middle-truncate filenames** (`report-2026…final.pdf`) so the file extension is never clipped off.
9. **Hyphenate narrow columns:** Enable `hyphens: auto` (with a valid `<html lang="...">`) and `text-wrap: pretty`.
10. **Cap variable card titles** with `-webkit-line-clamp: 2` so grid rows stay aligned, and align icons by **optical center** rather than raw bounding boxes.

Code implementations: [`references/typography-and-geometry.md`](references/typography-and-geometry.md#2-ten-optical-typography-fixes-plus-tracking-leading--alignment).

---

## 5. Native-Feeling Mobile UX & Apple-Grade Fluid Motion

### Ten Mobile CSS & HTML Rules
1. **`font-size: max(16px, 1rem)`** on all inputs (`<input>`, `<select>`, `<textarea>`) to stop iOS Safari auto-zoom on tap, paired with **`>= 44–48px` touch targets** (use invisible `::before { inset: -10px; }` hit slop on compact icons).
2. **`-webkit-tap-highlight-color: transparent`** on all links and controls.
3. **`inputmode="numeric"`** (or `"decimal"`) on numeric fields so mobile opens the number pad.
4. **Wrap `:hover` styles** inside `@media (hover: hover) and (pointer: fine)` so hovers never stick on touch devices.
5. **`autocomplete="one-time-code"`** on SMS/2FA verification inputs.
6. **`overscroll-behavior: contain`** on modals, drawers, and sheets so scrolling never leaks to the page behind.
7. **`type="email" autocapitalize="none" autocorrect="off" spellcheck="false"`** on email fields.
8. **`touch-action: manipulation`** on interactive buttons to eliminate double-tap zoom delay.
9. **`enterkeyhint="send"`** (or `"search"`, `"done"`, `"next"`) on chat and search inputs.
10. **`scroll-snap-type: x mandatory`** + `scroll-snap-align: start` on carousels, **`100dvh`** instead of `100vh`, and **`env(safe-area-inset-*)`** for notched displays.

### Apple Fluid Motion & Micro-Interaction Laws
- **Never scale from `0`:** Enter modals from `scale(0.97)` and popovers from `scale(0.95)`, anchored to the trigger (`transform-origin`), and collapse back into the trigger on close.
- **Press feedback on pointer-down:** Scale buttons to `scale(0.97)` on `:active`.
- **Exits ~20% faster than entrances:** E.g., `200ms` entrance (`cubic-bezier(0.22, 1, 0.36, 1)`), `160ms` exit. Keep dropdowns at `150–250ms` and stagger list rows by `30ms`.
- **Stretch moving toggle knobs by `12%`** (`scaleX(1.12)`) during translation; move 2D objects along curved **arcs** using independent X/Y springs.
- **Crossfade swapped icons** (`Copy` ↔ `Check`) with `blur(3px)` and `scale(0.85)`.
- **Validation error shake:** Pair red invalid states with a horizontal `translate3d` shake keyframe; use a subtle pulse to confirm success.
- **Directional stepper transitions:** Slide forward/backward steps in their spatial direction rather than fading in place.
- **Smooth `height: auto` accordions:** Use `interpolate-size: allow-keywords` (or CSS Grid `0fr → 1fr`).
- **Compositor-only properties:** Animate `transform` and `opacity` only—never `top`, `left`, `width`, or `height`.
- **Suppress transitions during theme switch:** Strip transitions for one frame during dark/light toggles so elements don't flash asynchronously.
- **Tooltip warmup:** Delay only the first tooltip (`280ms`); open adjacent tooltips immediately (`0ms`) while roaming.
- **Velocity-inheriting springs & rubber-banding:** Default UI springs use critical damping (`ζ = 1.0`, zero bounce). Reserve under-damped bounce (`ζ ≈ 0.8`) for flick/throw gestures with momentum projection (`current + (v/1000) * d / (1 - d)`), and apply progressive rubber-band resistance past drag boundaries. Always remain **interruptible** mid-flight and honor `@media (prefers-reduced-motion: reduce)`.

Full reference, 12 Disney animation principles, 22 cognitive UX laws (*Primacy, Von Restorff, Zeigarnik, Tesler, Serial Position, Progressive Disclosure, Goal Gradient, Recognition over Recall, Pareto 80/20, Occam's Razor, Parkinson, Uniform Connectedness, Paradox of the Active User, Cognitive Load, Default Effect, Peak–End, Fitts, Miller, Doherty `<400ms`, Gestalt, Hick, Frequency of Use*), and production patterns (*Amazon Safe Triangles, Resilient CopyButton, Optimistic Updates + Undo Toasts, Idempotency Keys, Skeleton Letters, BlurHash, SWR, Command Menu `⌘K`, View Transitions*):
- [`references/motion-mobile-and-ux-patterns.md`](references/motion-mobile-and-ux-patterns.md)
- [`references/apple-fluid-interfaces.md`](references/apple-fluid-interfaces.md)

---

## 6. 3D, WebGL, WebGPU, Portals & Shaders

When a brief calls for a spatial or shader-driven signature moment, use the tested architectures in [`references/techniques/3d-portals-shaders-and-webgl.md`](references/techniques/3d-portals-shaders-and-webgl.md) and [`blueprints/`](blueprints/):

- **Procedural 30-Bone `SkinnedMesh` 3D Book Slider** (`React Three Fiber` + `maath` `dampAngle`, full component in [`blueprints/animated-book-slider-Book.jsx`](blueprints/animated-book-slider-Book.jsx)).
- **3D Portal Cards** (`@react-three/drei` `<MeshPortalMaterial>` with SDF rounded planes and full-screen `blend` transitions).
- **Persistent WebGL Shared-Element Route Transitions** (`react-reverse-portal` + Framer Motion `layoutId` + frame-synced camera aspect `<Resizer>`).
- **Single-File Zero-Build Interactive 3D World** (vanilla Three.js + custom GLSL bus/clock shaders + guided camera spline tour + 3-level progressive disclosure, full 170 KB blueprint in [`blueprints/inside-the-microchip-3d.html`](blueprints/inside-the-microchip-3d.html)).
- **Shader & Effect Stack:** `Paper Shaders` (`LiquidMetal` / `LiquidLogo`, `MeshGradient`, `Dithering`), `Glisse` (Apple Liquid Glass SVG optical refraction), `Three-Geospatial` (live volumetric clouds over 3D terrain), `WebGPU` fullscreen quad shaders, `WebGL-Fluid-Simulation` (Navier-Stokes cursor fluid), `ThreeUI` (Catmull-Rom scroll camera rails), `Shader Lab` (stackable halftone dither + CRT + chromatic aberration), `GLTransitions` (100+ GLSL transitions), `React Bits` (63+ animated backgrounds), `Pokemon Cards CSS` (pure CSS holographic foil & 3D tilt), `Vanta.js`, `Canvas UI`, `Preact` 3 KB widget wrappers, and `ShaderGradient` (React & Python Reflex/NiceGUI/Gradio/Streamlit).

---

## 7. Product UI Illustrations, Bento Grids & Scripted Cursor Demos (`stageshow/`)

Whenever a marketing hero, feature card, bento grid, or documentation page needs a framed product UI illustration or a scripted cursor walkthrough (browser windows, desktop apps, iOS phones, Dynamic Island, notifications, chat threads, terminals, or multi-cursor presence), use the bundled **Stageshow** subsystem in [`stageshow/SKILL.md`](stageshow/SKILL.md):

- **The core principle:** It reads as a real product, simplified to what the viewer needs (usually 3–7 real strings where the story happens, quiet placeholder bars at the edges), cropped with intent (filling at least two-thirds of the stage and bleeding off an edge rather than floating like a boxed screenshot), where every cursor motion has a cause.
- **69 Gold & Product-Study Scenes ([`stageshow/examples/`](stageshow/examples/)):** Start by copying the closest scene (`hero-demo`, `static-card`, `bento`, `dark-bento`, `ruled-bento`, `staggered-bento`, `ai-chat`, `ai-cards`, `chart-scrub`, `table-edit`, `reorder`, `calendar`, `dynamic-island`, `phone-touch`, `presence`, `linear`, `figma`, `raycast`, `finder-glass`, `slack`, `spotify`, `notion`, `gmail`, `imessage`, etc.) rather than drawing windows or cursors from scratch.
- **The Stageshow Kit ([`stageshow/kit/`](stageshow/kit/)):** Copy-in React + CSS primitives (`Stage`, `Act`, `Window`, `Phone`, `LockScreen`, `Notification`, `Keyboard`, `Thread`, `Bubble`, `Collapse`, `Roll`, `Swap`, `Count`, `Connector`, `Fly`, `Follow`, `States`, `Stream`, `Popover`, `Scroll`, `Camera`, `Expand`, `Row`, `Field`, `Button`, `Segmented`, `Tabs`, `Toast`, `BrandMark`), plus [`stageshow/vanilla-runtime/`](stageshow/vanilla-runtime/) and `stageshow/scripts/export.mjs` when exporting a framework-free HTML/CSS/JS embed.
- **Rehearsal & Filming Gate ([`stageshow/scripts/film.mjs`](stageshow/scripts/film.mjs)):** Film both the poster frame and the full loop contact sheet at desktop width and `390px` with `--gate` until it ends with `rehearsal passed`.

---

## 8. Build & Verification Workflow (The 800+ Blueprint Engine)

### Step 1: Choose Page Run vs. App Screen Run
- **Marketing page / landing page / portfolio / editorial site:** Follow steps 2–6 below, or study the 40 full hero/landing specs in [`examples/INDEX.md`](examples/INDEX.md) and the 67 design systems in [`styles/INDEX.md`](styles/INDEX.md).
- **Application screen (dashboard, analytics, admin, inbox, settings, editor):** Read [`references/app-screens.md`](references/app-screens.md) and deal an app direction:
  ```bash
  node <skill>/scripts/draw.mjs --app --kind <kind> --brief "<product>"
  ```

### Step 2: Inventory the Subject & Deal an Empirical Direction (247-Site Library)
List 8–12 concrete facts that belong only to this subject (its materials, location, output, constraints, or artifacts). Then deal three researched directions from [`library/`](library/):

```bash
node <skill>/scripts/draw.mjs --sector <sector> --brief "<one line about the subject>" \
  --sections features,showcase,proof,pricing,faq,cta,footer --options 3
```

Select the direction that best carries a specific truth from your inventory, then print its full blueprint sheet:

```bash
node <skill>/scripts/draw.mjs --sector <sector> --brief "<subject>" \
  --sections features,showcase,proof,pricing,faq,cta,footer --direction <chosen-id>
```

### Step 3: Source Real Imagery or Footage
Never invent dead image URLs or leave empty gray boxes:
1. Use the project's own assets or generate bespoke media.
2. Search open museum and archival collections (Openverse, Wikimedia Commons, Art Institute of Chicago, The Met) and public footage (Wikimedia, Internet Archive, NASA) with automatic license tracking:
   ```bash
   node <skill>/scripts/assets.mjs "<query>"
   node <skill>/scripts/assets.mjs --video "<query>"
   node <skill>/scripts/assets.mjs --get <ref>
   node <skill>/scripts/assets.mjs --credits
   ```
3. Pick curated public video loops and transparent cutouts from [`media/MEDIA.md`](media/MEDIA.md) and visual contact sheets `media/sheet-1.jpg`..`sheet-6.jpg`.

### Step 4: Build with One Signature & Quiet Supporting Craft
- Start from tokens (`--bg`, `--surface-1`, `--ink`, `--accent`, `--border`).
- Include **one interactive live element** native to the subject on the page, and choose **one signature motion or 3D technique** from [`references/techniques/INDEX.md`](references/techniques/INDEX.md) (74 recipes across 8 files).
- If the user requested a **prompt for another builder** (Lovable, Bolt, v0, Cursor, AI Studio), format the spec using [`references/spec-template.md`](references/spec-template.md) and [`references/builders.md`](references/builders.md).
- When choosing frontend packages (dialogs, `⌘K`, toasts, OTP, charts, virtualization, drag-and-drop), consult [`references/ui-library-picks.md`](references/ui-library-picks.md).

### Step 5: Automated Lint, Real-Browser Inspection & Visual Critique
Run the automated gate across source files and a live headless browser at `1440px`, `768px`, and `390px`:

```bash
node <skill>/scripts/lint.mjs <source-folder-or-files>
node <skill>/scripts/inspect.mjs <url-or-path/to/index.html>
node <skill>/scripts/scenes.mjs <url-or-path/to/index.html>   # if using pinned scroll scenes
```

Or capture multi-viewport Playwright screenshots and QA metrics with `python <skill>/scripts/shoot.py index.html shots/`.

Open the generated screenshots, score them against [`references/critique.md`](references/critique.md), [`references/review-rubric.md`](references/review-rubric.md), and [`references/web-interface-guidelines.md`](references/web-interface-guidelines.md), fix every `FAIL` and the top three visual weaknesses, and re-run until clean.

---

## Reference Map

| Module | Contents |
| --- | --- |
| [`references/palettes-and-aesthetics.md`](references/palettes-and-aesthetics.md) | `OKLCH` color science, 16 perceptual phenomena, 31 curated 3-color studio palettes, 20 historical aesthetics, 22 non-flat background recipes |
| [`references/typography-and-geometry.md`](references/typography-and-geometry.md) | Approved vs. banned fonts, 10 optical CSS typography fixes, concentric corner math, alpha borders, dark-mode elevation, 21-point refactoring protocol |
| [`references/motion-mobile-and-ux-patterns.md`](references/motion-mobile-and-ux-patterns.md) | 10 native mobile CSS/HTML rules, Apple-grade micro-interactions, 12 Disney principles, 22 cognitive UX laws, Amazon Safe Triangle, CopyButton, Optimistic UI, Idempotency, SWR |
| [`references/apple-fluid-interfaces.md`](references/apple-fluid-interfaces.md) | WWDC *Designing Fluid Interfaces*: spring physics (`ζ`, response), velocity handoff, momentum projection, interruptibility, rubber-banding, translucent materials |
| [`references/techniques/INDEX.md`](references/techniques/INDEX.md) | 74 copy-paste motion, scroll, video, surface, type, 3D portal, book-slider, WebGPU, and shader recipes across 8 category files |
| [`references/app-screens.md`](references/app-screens.md) | Dedicated design rules, layouts, and chart patterns for dashboards, admin views, settings, and workspaces |
| [`references/web-interface-guidelines.md`](references/web-interface-guidelines.md) | Accessibility, keyboard focus, form semantics, hydration, performance, and copy audit checklist |
| [`references/ui-library-picks.md`](references/ui-library-picks.md) | Opinionated React/web package choices (`base-ui`, `cmdk`, `Sonner`, `input-otp`, `motion`, `NumberFlow`, `Liveline`, `Virtuoso`, `zustand`) |
| [`references/critique.md`](references/critique.md) & [`references/tells.md`](references/tells.md) | 14-pass screenshot evaluation rubric and empirical registry of AI-generated design tells from 247 studied sites |
| [`styles/INDEX.md`](styles/INDEX.md) | 67 complete design system style guides (`agentic`, `bento`, `brutalism`, `claymorphism`, `dithered`, `editorial`, `glassmorphism`, `minimal`, `neobrutalism`, `riso`, `shadcn`, `skeumorphism`, etc.) |
| [`examples/INDEX.md`](examples/INDEX.md) | 40 complete end-to-end hero and landing page build specifications |
| [`media/MEDIA.md`](media/MEDIA.md) | Publicly hosted cinematic video loops, transparent cutouts, and visual contact sheets (`media/sheet-1.jpg`..`sheet-6.jpg`) |
| [`blueprints/`](blueprints/) | Complete production source files: `inside-the-microchip-3d.html`, `animated-book-slider-Book.jsx`, `shadcn-v4-copy-button.tsx` |
| [`stageshow/`](stageshow/SKILL.md) | Benji Taylor's product-UI illustration, bento grid, and scripted cursor-demo engine: 69 gold scenes (`stageshow/examples/`), React kit (`stageshow/kit/`), plain-JS exporter (`stageshow/vanilla-runtime/`), 15 craft/framing references, 9 bad/good teaching pairs, and `film.mjs` rehearsal gate |
| [`library/`](library/) & [`scripts/`](scripts/) | JSON database of 247 studied sites, 20 directions, 100+ hero/section/app blueprints, plus `draw.mjs`, `lint.mjs`, `inspect.mjs`, `scenes.mjs`, `assets.mjs`, and `shoot.py` |
