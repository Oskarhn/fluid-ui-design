# Native Mobile UX, Apple-Grade Motion, Cognitive Laws & Production UI Engineering

Implementation manual for native-feeling mobile CSS, physical animation laws, cognitive psychology, and resilient frontend architecture.

---

## 1. Ten Native-Feeling Mobile UI/UX Hacks (Plus Touch Engineering)

Web apps feel clunky on phones when they leak browser defaults (auto-zoom on tap, gray flash rectangles, background page scrolling inside modals, or stuck hover states). Apply all ten rules by default:

```css
/* 1. Dynamic viewport height — prevents Safari's collapsing address bar from clipping bottom bars */
.app-shell, .hero-viewport {
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* 2. Prevent iOS Safari auto-zoom on input focus (triggers whenever font-size < 16px)
      and ensure a generous >= 44–60px touch target height */
input, select, textarea {
  font-size: max(16px, 1rem);
  min-height: 48px;
}

/* 3. Remove the gray tap-highlight flash on iOS/Android; replace with instant :active scale */
a, button, [role="button"], input, label {
  -webkit-tap-highlight-color: transparent;
}

/* 4. Prevent double-tap zoom delay on interactive buttons and controls */
button, [role="button"], .interactive-control {
  touch-action: manipulation;
}

/* 5. Prevent stuck hover states on touch screens — only bind hover visuals on fine pointers */
@media (hover: hover) and (pointer: fine) {
  .button:hover {
    background-color: var(--surface-hover);
  }
}

/* 6. Stop modal, drawer, and popup scrolling from chaining to the background page */
.modal-body, .drawer-scroll, .popover-list {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* 7. Ensure carousels never stop halfway between cards */
.carousel-rail {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 20px;
  scrollbar-width: none;
}
.carousel-card {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

/* 8. Hit Slop — expand invisible touch area around compact 24–32px icon buttons to >= 44px */
.compact-icon-btn {
  position: relative;
}
.compact-icon-btn::before {
  content: "";
  position: absolute;
  inset: -10px;
}
```

### Native Keyboard & Autofill HTML Attributes (Hacks 8–10)
```html
<!-- 8. Numeric keypad instead of full QWERTY keyboard -->
<input type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Postnummer" />

<!-- 9. One-time SMS verification code autofill -->
<input
  type="text"
  inputmode="numeric"
  autocomplete="one-time-code"
  maxlength="6"
  aria-label="Bekreftelseskode"
/>

<!-- 10. Email without auto-capitalizing the first letter + Chat input with 'Send' return key -->
<input
  type="email"
  inputmode="email"
  autocapitalize="none"
  autocorrect="off"
  spellcheck="false"
  autocomplete="email"
/>

<input
  type="text"
  enterkeyhint="send"
  placeholder="Skriv en melding…"
/>
```

### Advanced Mobile Gesture Architecture
- **Swipe-to-dismiss sheets:** Track pointer Y delta `1:1` with `setPointerCapture`. On release, project the resting position using release velocity (`currentY + (v / 1000) * 0.998 / 0.002`) rather than simple distance threshold, and hand off velocity directly to the closing spring.
- **Predictive back:** During an edge-swipe or back gesture, scale the active view slightly down (`scale(0.94)`) while revealing the underlying view beneath it before the user commits to releasing.
- **Safe Area Insets:** Set `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and pad sticky headers/footers with `env(safe-area-inset-top)` and `max(16px, env(safe-area-inset-bottom))`.

---

## 2. Apple-Grade Motion & Micro-Interaction Laws

### The Core Timing & Spatial Rules
1. **Never scale from `0`:** Elements appearing from `scale(0)` look like a cheap cartoon pop. Start modals and panels at `scale(0.97)` (and popovers/menus at `scale(0.95)`) with `opacity: 0 → 1`.
2. **Tactile button press (`0.97`):** Scale buttons down to `transform: scale(0.97)` on `:active` (pointer-down, not click release).
3. **Make exits ~20% shorter than entrances:** Entering elements need time for the eye to register them (`200–240ms`); dismissing elements should get out of the user's way quickly (`150–180ms`).
4. **Origin-aware popovers:** Transition menus, dropdowns, and popovers out from the **trigger** (`transform-origin: var(--trigger-origin)`), never from the dead center of the viewport, and collapse them back into the trigger on close.
5. **Keep dropdowns at `150–250ms`:** Snappy enough to feel instant, smooth enough to establish spatial origin.
6. **Stagger list rows by `30ms`:** Cap total stagger delay at `~300ms` so long tables never make the user wait. Stagger secondary details as the container settles.
7. **Stretch moving knobs by `12%`:** When a switch toggle or slider thumb travels from left to right, stretch its horizontal scale (`scaleX(1.12)`) mid-flight and settle back to `scaleX(1)` on arrival.
8. **Crossfade icons with `blur` and `scale`:** When swapping two icons (e.g., `Copy` → `Check`, `Play` → `Pause`, `Sun` → `Moon`), animate outgoing/incoming icons through `opacity: 0`, `scale(0.85)`, and `filter: blur(3px)` over `160ms` so the morph feels peaceful rather than a hard pixel cut.
9. **Shake on invalid password / error:** Don't rely on red borders alone—pair invalid submit feedback with a horizontal shake keyframe so the rejection is physical and accessible.
10. **Slide steppers directionally:** In a multi-step wizard or onboarding flow, slide step `N → N+1` in from the right (`translateX(24px → 0)`) while `N` exits left (`translateX(0 → -24px)`), and reverse the direction when clicking "Back".
11. **Smooth `height: auto` accordions (`interpolate-size`):** Use `interpolate-size: allow-keywords` (or CSS Grid `grid-template-rows: 0fr → 1fr`) so accordions never snap shut.
12. **Compositor-only properties:** Animate `transform` and `opacity` exclusively. Never animate `top`, `left`, `width`, `height`, or `margin`, which trigger main-thread layout and paint on every frame.
13. **Kill transitions during theme switch:** Toggling dark/light mode can trigger hundreds of competing `background-color` and `border-color` transitions at once. Inject a temporary `.theme-switching * { transition: none !important; }` class, toggle the theme, force a reflow (`void document.body.offsetHeight`), and remove the class on the next frame.
14. **Tooltip warmup pattern:** Delay the *first* tooltip hover by `280ms` so casual cursor movement doesn't spam popups. Once one tooltip is open, set a `400ms` warmup window where adjacent tooltips open with `0ms` delay and `0ms` duration.
15. **No spring bounce on everyday UI:** Use critically damped springs (`damping: 1.0`, zero overshoot) or smooth deceleration curves (`cubic-bezier(0.22, 1, 0.36, 1)`) for menus, dialogs, and tabs. Reserve under-damped bounce (`damping: ~0.8`) strictly for user gestures that carry physical momentum (flicks, throws, drag releases).
16. **Rubber-band past drag boundaries:** Never hard-stop a drag or carousel at the end of its track; apply progressive resistance.
17. **Use `ease-in-out` for on-screen point-to-point movement**, and **`ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`) for elements entering the screen**.
18. **Move objects along arcs:** In 2D translations (e.g., moving a thumbnail to a cart or expanding a card diagonally), decompose X and Y into slightly offset easing curves or independent X/Y springs so the object travels along a natural curved arc rather than a robotic diagonal line.
19. **Bring the new state in as the old state leaves:** Overlap outgoing and incoming states rather than waiting for a full exit before starting the entrance.
20. **Use masks (`clip-path` / `mask-image`) for reveals and color changes:** Wipe a high-contrast theme inversion or image reveal across the element using `clip-path: inset(...)` instead of a flat opacity fade.
21. **Use a subtle pulse to confirm success** (`scale(1 → 1.04 → 1)` + ring fade).
22. **Don't tween handheld / frame-by-frame animations:** Intentional stop-motion or sketched states should use `steps()` timing functions rather than floaty linear interpolation.
23. **Reuse `layoutId` across shared objects** (Framer Motion shared layout or native CSS `view-transition-name`).

### Copy-Paste CSS & JS for Core Motion Recipes

```css
:root {
  --ease-out-quart: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
  /* Opt into smooth height: auto transitions */
  interpolate-size: allow-keywords;
}

/* 1. Button press & success pulse */
.btn-fluid {
  transition: transform 140ms var(--ease-out-quart), background-color 150ms ease;
}
.btn-fluid:active {
  transform: scale(0.97);
}

/* 2. Origin-aware Popover (200ms entrance, 160ms exit = 20% shorter) */
.popover-panel {
  transform-origin: var(--popover-origin, top left);
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity 160ms ease-in,
    transform 160ms ease-in;
  pointer-events: none;
}
.popover-panel[data-state="open"] {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 200ms var(--ease-out-quart),
    transform 200ms var(--ease-out-quart);
  pointer-events: auto;
}

/* 3. Peaceful Icon Swap with Blur + Scale */
.icon-swap-slot {
  position: relative;
  display: inline-grid;
  place-items: center;
}
.icon-swap-slot > svg {
  grid-area: 1 / 1;
  transition:
    opacity 180ms var(--ease-out-quart),
    transform 180ms var(--ease-out-quart),
    filter 180ms var(--ease-out-quart);
}
.icon-swap-slot > svg[data-active="false"] {
  opacity: 0;
  transform: scale(0.82);
  filter: blur(3px);
  pointer-events: none;
}
.icon-swap-slot > svg[data-active="true"] {
  opacity: 1;
  transform: scale(1);
  filter: blur(0px);
}

/* 4. Password / Validation Error Shake */
@keyframes error-shake {
  0%, 100% { transform: translate3d(0, 0, 0); }
  20%      { transform: translate3d(-6px, 0, 0); }
  40%      { transform: translate3d(5px, 0, 0); }
  60%      { transform: translate3d(-4px, 0, 0); }
  80%      { transform: translate3d(2px, 0, 0); }
}
.input-field[aria-invalid="true"] {
  border-color: oklch(0.62 0.22 28);
  animation: error-shake 340ms var(--ease-out-quart);
}

/* 5. Toggle Switch Knob with 12% Mid-Travel Stretch */
.switch-thumb {
  transition: transform 220ms var(--ease-in-out-cubic);
}
.switch:active .switch-thumb {
  transform: scaleX(1.12);
}
.switch[data-checked="true"] .switch-thumb {
  transform: translateX(20px);
}
.switch[data-checked="true"]:active .switch-thumb {
  transform: translateX(20px) scaleX(1.12);
}
```

```ts
// 6. Theme Switch Without Transition Flash
export function switchThemeCleanly(nextTheme: "light" | "dark") {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*, *::before, *::after { transition: none !important; animation: none !important; }"
    )
  );
  document.head.appendChild(style);
  document.documentElement.setAttribute("data-theme", nextTheme);
  document.documentElement.style.colorScheme = nextTheme;
  // Force synchronous style recalc before restoring transitions
  void window.getComputedStyle(document.body).opacity;
  requestAnimationFrame(() => {
    document.head.removeChild(style);
  });
}

// 7. Apple Rubber-Band Boundary Resistance
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

---

## 3. The Twelve Animation Principles Applied to UI

| # | Principle | UI Engineering Application |
| --- | --- | --- |
| 01 | **Squash and stretch** | Stretch a moving switch knob by `12%` along its travel axis; compress a rubber-banded scroll list slightly at the boundary. |
| 02 | **Anticipation (Wind-up)** | Scale a button or card down to `0.97` on pointer-down before launching its modal or action on pointer-up. |
| 03 | **Staging the focus** | Dim the background with an alpha scrim and scale the parent sheet back (`scale(0.96)`) so the active dialog owns 100% of focus. |
| 04 | **Pose-to-pose vs. Straight-ahead** | Use deterministic state poses (`open` / `closed`) interpolated by continuous velocity-aware springs that can be interrupted at any frame. |
| 05 | **Follow-through & Overlapping action** | Let card headings and badges settle `30–60ms` after the card surface arrives so the container doesn't move like a rigid brick. |
| 06 | **Slow in, slow out** | Use asymmetric easing (`cubic-bezier(0.22, 1, 0.36, 1)`) for entrances—fast initial velocity, gentle sub-pixel deceleration. |
| 07 | **Moving in arcs** | Give X and Y slightly different spring response times (`0.32s` vs `0.40s`) during 2D shared-element transitions so elements travel on a curve. |
| 08 | **Secondary action** | Nudge an arrow icon `translate(2px, -2px)` or pulse a checkmark ring while the primary button label updates. |
| 09 | **Snappy timing** | Micro-interactions (`120–220ms`), exits `20%` faster than entrances, zero artificial wait before visual feedback. |
| 10 | **Exaggerated feedback** | Horizontal shake on failed auth, magnetic pull on a primary studio CTA, holographic foil tilt on collectible cards. |
| 11 | **Solid drawing in 3D** | Concentric corner radii (`r_in = r_out - p`), 1px top specular light catch on dark surfaces, consistent perspective vanishing points. |
| 12 | **Overall appeal** | Restraint: one signature choreography per screen, surrounded by calm surfaces and instant responsiveness. |

---

## 4. Twenty-Two Cognitive Psychology & UX Laws

Design interfaces around how human memory, motor control, and attention operate:

| Law / Principle | Cognitive Mechanism | Concrete Interface Rule |
| --- | --- | --- |
| **Primacy effect** | Users remember the first item in a sequence far better than middle items. | Place the core value proposition or primary navigation destination first. |
| **Serial position effect** | Recall peaks at the start (*primacy*) and end (*recency*) of a list, dropping in the middle. | Put the most critical destinations at the far left/top and far right/bottom of navbars and mobile tab bars. |
| **Von Restorff effect** | When multiple homogeneous objects are present, the one that differs visually is remembered and acted on. | Keep 90% of the UI in calm ground/secondary tones so the single 10% accent CTA or alert stands out effortlessly. |
| **Zeigarnik effect** | People remember uncompleted or interrupted tasks better than completed ones. | Show clear draft badges, step progress indicators, and resumable state so users naturally finish multi-step flows. |
| **Goal gradient effect** | Effort and motivation accelerate as a person gets closer to completing a goal. | Pre-complete step 1 of onboarding (e.g., account created = 25% done) and animate progress bars smoothly. |
| **Tesler's law** | Every application has an inherent, irreducible amount of complexity; the only question is whether the system or the user bears it. | Absorb complexity in engineering (auto-detect timezone, format credit card spaces, infer country from postcode) instead of adding form fields. |
| **Progressive disclosure** | Showing every option at once overwhelms working memory. | Display the 3–4 primary controls on the main surface; reveal advanced filters, raw JSON, or audit logs inside an expandable drawer or inspector. |
| **Recognition over recall** | Recognizing a visible option requires a fraction of the cognitive effort of recalling syntax from memory. | Provide a `⌘K` command menu with fuzzy search, recent items, and visible `<kbd>` shortcut hints. |
| **Pareto principle (80/20)** | Roughly 80% of outcomes come from 20% of features. | Dedicate primary screen real estate to the core 20% daily workflow; move administrative configuration off the main canvas. |
| **Occam's razor** | Among competing designs that solve the user's task equally well, the one with the fewest visual assumptions and moving parts wins. | Cut any card border, eyebrow, or step that can be removed without losing comprehension. |
| **Parkinson's law** | Work—and form input bloat—expands to fill the time and space allotted to it. | Size form inputs to match their expected data (`6ch` for OTP/postal code, `16ch` for phone, `32ch` for name) instead of stretching every input to `100%` width. |
| **Uniform connectedness** | Elements connected by a shared background well, border, or line are perceived as a single functional unit. | Group segmented controls, filter pills, or coupled input+button bars inside one shared surface well (`--surface-raised-1`). |
| **Paradox of the active user** | Users never read documentation before using software; they dive straight into clicking controls. | Make empty states actionable with 1-click starter data and self-explanatory inline microcopy rather than linking to a manual. |
| **Cognitive load** | Working memory has a strict bandwidth limit; extraneous visual noise steals capacity from the user's actual task. | Eliminate competing high-chroma colors, decorative numbering, and redundant labels. |
| **Default effect** | Users overwhelmingly keep pre-selected default settings. | Set the safest, most common, highest-value configuration as the default out of the box. |
| **Peak–end rule** | People judge an experience primarily by how they felt at its most intense moment (*peak*) and at its completion (*end*). | Invest disproportionate craft in the page's one signature interactive moment and in the final completion/confirmation state. |
| **Fitts's law** | Time to acquire a target is a logarithmic function of distance divided by target size: $T = a + b \log_2(1 + D/W)$. | Make primary CTAs large (`min-height: 44–48px`), place actions near the trigger that spawned them, and eliminate dead clickable gaps between `<label>` and `<input>`. |
| **Miller's law** | Working memory holds roughly $7 \pm 2$ chunks (modern research refines active visual chunking to **3–5 items**). | Group navigation links, dashboard KPI cards, and long numeric strings (`1234 5678 9012`) into chunks of 3 to 5. |
| **Doherty threshold** | System-human flow state engages when response latency stays below **400 ms** (ideally `< 100 ms` for direct manipulation). | Fire press states on `pointerdown`, apply optimistic UI updates immediately, and prefetch routes on hover/focus intent. |
| **Gestalt laws** | Proximity, similarity, continuity, closure, and common fate govern how the brain groups pixels into objects. | Double the spacing *between* groups compared to the spacing *inside* a group (`gap-outer >= 2 * gap-inner`), replacing explicit divider lines. |
| **Hick's law** | Decision time increases logarithmically with the number of choices: $T = b \log_2(n + 1)$. | Offer one clear primary action per card or hero; collapse secondary actions into a contextual menu. |
| **Frequency of use** | Controls should be ranked spatially by how often a user reaches for them. | Keep daily actions top-level with single-key shortcuts; place rare or destructive actions (`Delete workspace`) at the bottom of settings behind confirmation or undo. |

---

## 5. Production UI Engineering Patterns (Reference Code)

### 1. Amazon Safe Triangle (Diagonal Submenu Aim)
When a user hovers a parent item in a vertical sidebar or dropdown and moves their cursor diagonally toward the open flyout submenu, their cursor briefly crosses sibling items—closing the submenu right before they reach it. Compute a dynamic safe triangle from the cursor's previous position to the top-left and bottom-left corners of the open submenu:

```ts
export interface Point { x: number; y: number }

function sign(p1: Point, p2: Point, p3: Point): number {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

export function isPointInSafeTriangle(cursor: Point, prevCursor: Point, submenuRect: DOMRect): boolean {
  // Only activate when cursor is moving toward the submenu (left-to-right flyout)
  if (cursor.x <= prevCursor.x) return false;

  const topCorner: Point = { x: submenuRect.left, y: submenuRect.top - 8 };
  const bottomCorner: Point = { x: submenuRect.left, y: submenuRect.bottom + 8 };

  const d1 = sign(cursor, prevCursor, topCorner);
  const d2 = sign(cursor, topCorner, bottomCorner);
  const d3 = sign(cursor, bottomCorner, prevCursor);

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}
```

### 2. Resilient Copy Button with Fallback & Blur-Scale Icon Swap (`shadcn-ui/v4` Pattern)
Full source also included in [`blueprints/shadcn-v4-copy-button.tsx`](../blueprints/shadcn-v4-copy-button.tsx). Combines `navigator.clipboard.writeText`, an off-screen `readonly` `<textarea>` fallback for restricted iframes/contexts, a 2000ms reset timer, and the peaceful blurred icon transition:

```tsx
"use client";

import * as React from "react";

function legacyCopyToClipboard(value: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textArea);
  return ok;
}

export async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof window === "undefined" || !value) return false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return legacyCopyToClipboard(value);
    }
  }
  return legacyCopyToClipboard(value);
}
```

### 3. Optimistic Updates with Rollback & Non-Blocking Undo Toast
Instead of showing a blocking spinner or an annoying *"Are you sure you want to archive this item?"* modal, apply the state change immediately (Doherty threshold `< 50ms`), show an **Undo toast** with a 5-second commit window, and roll back cleanly if the user clicks Undo or the network fails:

```ts
export async function optimisticDeleteWithUndo<T extends { id: string }>({
  items,
  targetId,
  setItems,
  showUndoToast,
  commitDeleteApi,
}: {
  items: T[];
  targetId: string;
  setItems: (next: T[]) => void;
  showUndoToast: (msg: string, onUndo: () => void) => void;
  commitDeleteApi: (id: string, idempotencyKey: string) => Promise<void>;
}) {
  const snapshot = items;
  const idempotencyKey = crypto.randomUUID();
  let undone = false;

  // 1. Optimistic immediate update
  setItems(items.filter((item) => item.id !== targetId));

  // 2. Non-blocking Undo toast
  showUndoToast("Elementet ble arkivert", () => {
    undone = true;
    setItems(snapshot);
  });

  // 3. Commit after undo window expires, with automatic rollback on error
  setTimeout(async () => {
    if (undone) return;
    try {
      await commitDeleteApi(targetId, idempotencyKey);
    } catch {
      setItems(snapshot);
    }
  }, 4500);
}
```

### 4. Idempotency Keys for Safe Mutations
Prevent duplicate payments, orders, or form submissions when a user double-clicks or a mobile connection retries:

```ts
const inFlightMutations = new Map<string, Promise<Response>>();

export function fetchIdempotent(url: string, payload: unknown, actionKey: string): Promise<Response> {
  const existing = inFlightMutations.get(actionKey);
  if (existing) return existing;

  const idempotencyKey = crypto.randomUUID();
  const request = fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  }).finally(() => {
    inFlightMutations.delete(actionKey);
  });

  inFlightMutations.set(actionKey, request);
  return request;
}
```

### 5. Skeleton Letters, BlurHash Placeholders & Stale-While-Revalidate (SWR)
- **Skeleton letters:** Size skeleton bars to the exact cap-height of the font (`height: 1em; margin-block: calc((1lh - 1em) / 2)`) so swapping skeleton → real text causes zero vertical layout shift (0.000 CLS).
- **BlurHash / ThumbHash placeholders:** Decode a 28-byte compact hash into a `32×32` `<canvas>` or CSS data-URI on initial SSR render, then crossfade the `<img>` from `opacity: 0` on `onload`.
- **Stale-while-revalidate & Intent pre-rendering:** Serve cached data immediately (`0ms`), revalidate in the background, and trigger route/data prefetch on `pointerenter` or `focus` (`100–150ms` before click commit).
- **Command Menu (`⌘K`) & Shortcut Hints:** Bind `keydown` for `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"`, display `<kbd>⌘</kbd><kbd>K</kbd>` pills right-aligned inside action rows (Recognition over recall), and implement WAI-ARIA `role="combobox"` with `aria-activedescendant` for keyboard navigation.
- **View Transitions API:** Wrap DOM state changes in `document.startViewTransition(() => updateDOM())` with matching `view-transition-name` tokens so shared elements morph smoothly across pages.
