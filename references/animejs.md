# Anime.js 4.5

Use this guide when a web interaction has several timed phases, needs a playhead, should settle after a drag, or has to animate DOM, SVG, or numeric state from the same clock. Compare the brief with the [motion composition guide](motion-composition.md) first. Use [the runnable workbench](../blueprints/animejs/index.html) for the corresponding input and cleanup.

The pinned release is **4.5.0**, MIT, revision `2c9cf8ea00329f6768c7d7902252ed977d75ce42`. The [package and documentation index](../vendor/motion-sources/animejs-inventory.json) lists package export paths, the upstream example entry points, and 419 official documentation routes. The [source library](../vendor/motion-sources/README.md) explains where the full checkout and npm contents live. [Official documentation](https://animejs.com/documentation/), [release notes](https://github.com/juliangarnier/anime/releases/tag/v4.5.0).

## Choose an implementation

| Need | Use |
| --- | --- |
| A two-state hover, focus, or disclosure | Start with CSS. Keep an existing implementation when it already handles the required inputs and finish state. |
| One target with real keyframes, callback timing, or an object value | `animate`. Use `waapi.animate` for DOM motion whose properties and easing can run through the browser animation engine. |
| A sequence you can play, pause, reverse, and scrub | `createTimeline` with named phases. Use one clock for the container, related visual feedback, and the readout. |
| Live pointer input or a tilt responding to a changing target | `createAnimatable` with bounded values or `createDraggable` for constrained direct manipulation. |
| Grid, list, order, or bounds change with retained elements | `createLayout`. Keep original nodes and stable keys while applying the actual DOM or CSS change. |
| Scroll choreography through a defined region | Keep the actual scroll container. Use native scroll-driven CSS for standalone decorative motion. Use `onScroll` for linked timelines, multiple states, or callbacks. |
| Staggered type, path drawing, SVG shape change | `splitText`, `createDrawable`, `createMotionPath`, or `morphTo`. Keep content and an equivalent non-motion state. |
| Three.js positions, materials, lights, cameras, or uniforms | Existing renderer plus the v4.5 adapter. Keep GPU updates, resizing, and disposal with the renderer. |

Use standard v4 named imports in projects with npm. Install the version verified here and use the project's package manager and lockfile.

```sh
npm install animejs@4.5.0
```

```js
import { animate, createTimeline, createScope, stagger } from 'animejs';
```

Use only the modules the feature needs. The release also exports `animejs/animation`, `animejs/timeline`, `animejs/layout`, `animejs/svg`, `animejs/text`, `animejs/waapi` and other subpaths. A static project without a build step can import the [MIT browser bundle](../blueprints/animejs/vendor/anime.esm.min.js) with a relative ESM import. The separate Three.js adapter uses npm module imports so it shares Anime.js internals with the main package.

For v3 code, check the official migration guide before porting. v4 uses `animate(target, options)`, `createTimeline()` and `ease`. Rename settings with their behavior in mind and verify units. Milliseconds are the default. [Module entry points](https://animejs.com/documentation/getting-started/module-imports), [v3 migration guide](https://github.com/juliangarnier/anime/wiki/Migrating-from-v3-to-v4).

## The API by job

| Feature | What to preserve in a project | Official reference |
| --- | --- | --- |
| Timer | `createTimer` for progress, delays, interval updates, or a clock without visual targets. Tie completion to real work for uploads, payments, or other asynchronous actions. | [Timer](https://animejs.com/documentation/timer) |
| Animation | Explicit start and end states, property/keyframe values, function-based values, and a single owner per property. Pick `complete()`, `cancel()`, or `revert()` by the state to retain. | [Animation](https://animejs.com/documentation/animation) |
| Timeline | Labels, absolute positions, offsets, callbacks, and seeks use the same clock. Use `pause().seek(ms)` for a slider, `play()` and `reverse()` for direction, and a completion handler for the final label. | [Timeline](https://animejs.com/documentation/timeline) |
| Animatable | Predefine properties once and update their destinations from pointer, sensor, or keyboard input. Use one animatable per target and limit movement within the control. | [Animatable](https://animejs.com/documentation/animatable) |
| Draggable | Pick axes, container bounds and snap positions. Read `onUpdate` for the live value and `onSettle` to commit a drop. Provide a keyboard control that reaches the same value. | [Draggable](https://animejs.com/documentation/draggable) |
| Layout | Create a layout context for retained nodes and put the DOM mutation inside `layout.update()`. Use `record()` and `animate()` for separately scheduled measurements. Apply the same mutation directly for reduced motion. | [Layout](https://animejs.com/documentation/layout) |
| Scope | Give every mounted instance a root. Build within `scope.add()` or `scope.execute()`, use media queries for responsive setups, and call `scope.revert()` when the instance goes away. Remove your own event handlers in the scope cleanup callback. | [Scope](https://animejs.com/documentation/scope) |
| Events | Point `onScroll` at the actual scroll container and target. Specify start/end alignments. Use `sync: true` for direct timeline progress and inspect reverse scrolling, anchoring, and resize. Call `revert()` if the observer is retained separately. | [Events](https://animejs.com/documentation/events) |
| SVG | Animate `draw` on `svg.createDrawable()` targets. Follow an authored SVG path with `createMotionPath()`, or use `morphTo()` for compatible silhouettes. Keep the viewport and path units stable. | [SVG](https://animejs.com/documentation/svg) |
| Text | Split a contained headline by word, line, or character only when it serves the composition. Keep a meaningful accessible name, verify resize and languages without word spaces, and call `revert()` when finished or unmounted. Keep animated numbers backed by real data. | [Text](https://animejs.com/documentation/text) |
| Utilities | Use `stagger` for order, distance, or a grid and `utils.mapRange`, `clamp`, or `snap` for state math. v4.5 provides 3D grids, jitter, and seeds for repeatable timing. Keep stagger readable at narrow widths. | [Utilities](https://animejs.com/documentation/utilities), [v4.5 notes](https://github.com/juliangarnier/anime/releases/tag/v4.5.0) |
| Easing | Use a measured curve for a reference match, `spring()` for an object that can be interrupted, and linear easing for progress that should track a real quantity. Verify overshoot near edge bounds. | [Easings](https://animejs.com/documentation/easings) |
| WAAPI | Favor opacity and transforms where practical. Revert interrupted effects and leave a valid computed rest state. Test the actual properties and easing on the target browsers. | [WAAPI](https://animejs.com/documentation/waapi) |
| Engine | The engine controls global time units, speed, frame scheduling and visibility behavior. Keep these defaults isolated from reusable components. An external renderer can drive its own render loop and read the animated state. | [Engine](https://animejs.com/documentation/engine) |
| Adapters | Use the separate v4.5 adapter entry point before animating a Three.js object. Keep graphics-resource lifetime in the calling code. Use `registerAdapter()` for deliberate integration of other non-DOM targets. | [Adapters](https://animejs.com/documentation/adapters), [Three.js adapter](https://animejs.com/documentation/adapters/threejs-adapter) |

## Adapt an existing study

| Starting point | Use Anime.js when the request changes |
| --- | --- |
| [Desktop Copier](../blueprints/reference-components/refined-artifacts.mjs) | Add pause or scrub by mapping lid, scan, eject, and pickup to named phases. Keep paper insertion and pickup as explicit interaction states. |
| [Color Pass](../blueprints/reference-components/refined-artifacts.mjs) | Use labels for icon reveals and final paint, and drive existing Canvas drawing through a numeric progress object. Keep its source timings, its cancellation behavior, and the static completion state. |
| [Volume slider](../blueprints/reference-components/refined-controls.mjs) | Model the real value as input state. Retarget the visual wake with `createAnimatable`, or use `createDraggable` when adapting it to a bounded physical knob. Keep the keyboard slider and stationary reference marks. |
| [Archive Drawer](../blueprints/reference-components/fidelity-archive.mjs) | Define closed, hover, and open before changing the timeline. With a Three.js scene, animate the group's transform and project its hit regions from the updated scene. |
| [File and layout studies](../blueprints/reference-components/refined-data.mjs) | Use `createLayout` for changed ordering or geometry. Update the real list/detail state in the mutation and keep focus on its invoking control. |

For a custom reference, decide the user action, visible subject, rest pose, transition duration, overlap, and cancellation behavior before choosing modules. Measure the source when available. Test the user changing direction halfway through as well as the first successful run. Adapt content, sizes, type, and color to the receiving project.

## Reusable recipes

### Scrubbable sequence

This pattern uses milliseconds. The label marks when the SVG trace begins and the readout can derive its percentage from the timeline.

```js
import { createTimeline, stagger, svg } from 'animejs';

const sequence = createTimeline({ autoplay: false })
  .label('trace', 0)
  .add(svg.createDrawable(path), {
    draw: ['0 0', '0 1'],
    duration: 900,
    ease: 'linear',
  }, 'trace')
  .label('markers', 230)
  .add(markers, { opacity: [0, 1], duration: 380, delay: stagger(110) }, 'markers');

slider.addEventListener('input', () => {
  sequence.pause().seek(sequence.duration * Number(slider.value) / 100);
}, { signal });
signal.addEventListener('abort', () => sequence.revert(), { once: true });
```

If the timeline can reverse, map a visible progress fraction to reversed playback time. The workbench uses `sequence.reversed ? 1 - fraction : fraction` before seeking. When paused or with reduced motion, paint the requested state directly and keep the slider available.

### Three.js object

```js
import { animate } from 'animejs';
import 'animejs/adapters/three';

const lift = animate(folderGroup, {
  y: 1.15,
  rotateY: -10,
  duration: 480,
  ease: 'out(3)',
});
```

Paint with the project's renderer and camera. Verify the updated world position and any hit areas. Data-driven CSS or a DOM animation should share the same progress value when coordinated with the scene.

### Scope, preferences and teardown

- Build a baseline visible state. Use reduced-motion handling around the affected sequence. Keep start, stop, and end controls usable.
- Register reactive animation setup inside the scope. Use an `AbortController` for DOM listeners and observers the library does not own. Revert unmounts, restore split text, and release pointer capture when applicable.
- Use timeline callbacks or actual application state for completion. A skipped animation must still render its finished state. Keep keyboard, focus, screen-reader labels, and input semantics in the DOM.
- For heavy canvases, pause the render loop offscreen and measure main-thread cost at the project's breakpoints. Keep one owner per element and CSS property when mixing engines. Avoid animating layout properties per pointer event.

Serve the workbench over localhost so its ESM bundle loads in the browser.
The verification script starts its own server, uses the installed Chrome channel, and blocks external requests.

```sh
node blueprints/reference-components/test-server.mjs
node blueprints/animejs/verify.mjs
```

Set `PLAYWRIGHT_MODULE` when Playwright is installed outside the skill directory. In the receiving project, test intermediate frames, rapid re-entry, last-state wins, keyboard navigation, and reduced motion. [Official scope cleanup](https://animejs.com/documentation/scope).
