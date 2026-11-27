# Runnable reference components

Use the [catalog](catalog.mjs) to look up a reference by its URL, author, or behavior. The [interactive gallery](index.html) includes 88 entries built from 48 component implementations. It also links to the [11 Craft controls](../interaction-controls/index.html) and the [12 original Bencho blocks](../bencho/README.md).

| Collection | What runs |
| --- | --- |
| X motion studies | Fifteen components, one per supplied clip. They include the collapsing sidebar, action tiles, conversion funnel, archive drawer, dismissal stack, validation code, and layered onboarding. |
| Website interactions | Thirty-eight examples. Try the venue player, the restaurant ingredient disclosure, the pricing switch, the Venice hover and light change, and the Wabi deck. |
| Reference galleries | Ten search, filtering, preview, or background controls. |
| Bencho finds | Twenty-two examples. Try the route switch, copier, calendar, card tray, status controls, sliders, or connected views. |
| Supplied prompts | Three effects. Try the video backdrop, a fading Canvas 2D pointer mask, and beveled WebGL glass with printed text that travels with the shards. |

Each entry links to its reference or supplied-brief notes and to the component module. Multiple examples can use the same state model with different project data. An example covers the actions listed in its description. Screenshots, site-specific assets, account states, and complete website exports have separate coverage in the [site studies](../../references/website-and-control-studies.md) and [browser replay guide](../../references/authorized-replay.md).

Heron, Land-book, and the linked OpenAI launch page have no component entry because the reference requests returned HTTP 403 during capture. The Framer marketplace entry is a working adaptation of its preview. Install a copy of the marketplace component from its publisher if the project needs that implementation. The local media demos use [bundled sample loops](../../media/preview-loops/README.md).

## Compare revised components with their sources

Use [the comparison page](compare-fidelity.html) to step through the source footage and interact with the component at matching bounds. Hold the sidebar midway through a drag to see its depth and the two strokes folding into the final icon. In the archive, hover a visible tab for a small lift, then click to pull the file out. The funnel and flame use Canvas 2D. The glass uses the bundled [Three.js 0.169.0 build](three/LICENSE), with a readable HTML fallback.

Prepare the six base comparison videos locally with FFmpeg. The directory must contain the five X exports listed in the catalog. Pass the Facet preview separately. The archive directory supplies the additional Bencho clips. The prompt media directory supplies `intelligence-bg.mp4`, `mons-masked.png`, and `mons-clear.png`.

```sh
node blueprints/reference-components/prepare-fidelity.mjs <authorized-x-clips-directory> <authorized-facet-preview.mp4> [higher-resolution-archive.mp4]
node blueprints/reference-components/prepare-context-assets.mjs <authorized-browser-archive-directory>
node blueprints/reference-components/prepare-prompt-assets.mjs <authorized-prompt-media-directory> [authorized-x-clips-directory]
```

The first tool builds the sidebar bezel and voice mark from the source, keeps the Quick Actions dashboard, and supplies the recorded archive lift through native controls. Its optional archive input accepts the larger source clip. The other tools add original site frames, embedded media when present, and the prompt's own backdrop footage and mask layers. The gallery uses this local material when opened with `?reference-assets=1`. The local archive presents ten named hit areas. Mono and Nord use the recorded lifts. The other cards lift from the photographed tabs and show locally drawn card faces. These files stay in `private-reference/`.

### Add a verified website replay

Record the authorized site with [replay-ui.mjs](../../scripts/replay-ui.mjs) using a plan that selects a real control and verifies its visible result. For a supported catalog item, import the archive after both sides pass the same state checks.

```sh
node blueprints/reference-components/prepare-website-replay.mjs <catalog-id> <recorded-archive-directory>
```

The comparison page offers both recordings. Its local Chrome button opens the archived HTML, styles, script and media in an isolated browser using only captured routes. Start the gallery server with `PLAYWRIGHT_MODULE` set if Playwright is installed elsewhere. Use the reusable component entry when you only need the interaction in a new design.

## Open and verify

From the skill directory, serve the gallery from localhost.

```sh
node blueprints/reference-components/test-server.mjs
```

Open [the local gallery](http://127.0.0.1:63845/blueprints/reference-components/index.html). A hash such as `#venice`, `#wabi`, or `#file-drawer` opens a specific demo.

Run the browser checks with Node 22 or newer, Chrome, and Playwright. Set `PLAYWRIGHT_MODULE` to the installed package directory if `playwright` is not available in the current project.

```sh
node blueprints/reference-components/verify.mjs
node blueprints/reference-components/verify.mjs venice wabi file-drawer
```

The full suite exercises each catalog entry and the Craft controls at 1280 px and 390 px. The narrow viewport has touch and reduced motion enabled. The tests block external network requests. They check state changes, actual media playback, clipboard contents, keyboard focus, scrolling, or pointer gestures as appropriate.

## Reuse a component

Find an entry in `catalog.mjs` and open its module from the gallery. Copy the function, its imports and relevant rules from `components.css`, `fidelity.css` or `refined.css`. Mount it inside `.library-preview` or scope its styles to the receiving container. Pass the entry's `options` and an `AbortSignal`. Abort when the component unmounts, then remove its DOM.

```js
import { floatingNav } from './navigation.mjs';

const lifetime = new AbortController();
floatingNav(document.querySelector('.library-preview'), { signal: lifetime.signal });
// Call lifetime.abort() before removing the component.
```

Replace sample labels, data, colors, and media for the receiving project. Keep the input, selected state, cancellation, and reduced-motion behavior. For upstream implementations of PanelUI, Loading.dev, Unfold, or Liquid Taffy, start with the [licensed source packages](../../vendor/interaction-packs/README.md).
