# Runnable reference components

Use the [catalog](catalog.mjs) to look up a reference by its URL, author, or behavior. The [interactive gallery](index.html) includes 88 entries built from 35 component implementations. It also links to the [11 Craft controls](../interaction-controls/index.html) and the [12 original Bencho blocks](../bencho/README.md).

| Collection | What runs |
| --- | --- |
| X motion studies | Fifteen components, one per supplied clip. They include the collapsing sidebar, action tiles, conversion funnel, archive drawer, dismissal stack, validation code, and layered onboarding. |
| Website interactions | Thirty-eight examples. Try the venue player, the restaurant ingredient disclosure, the pricing switch, the Venice hover and light change, and the Wabi deck. |
| Reference galleries | Ten search, filtering, preview, or background controls. |
| Bencho finds | Twenty-two examples. Try the route switch, copier, calendar, card tray, status controls, sliders, or connected views. |
| Supplied prompts | Three effects. Try the video backdrop, a fading Canvas 2D pointer mask, and beveled WebGL glass with printed text that travels with the shards. |

Each entry links to its reference or supplied-brief notes and to the component module. Multiple examples can use the same state model with different project data. An example covers the actions listed in its description. Screenshots, site-specific assets, account states, and complete website exports have separate coverage in the [site studies](../../references/website-and-control-studies.md) and [browser replay guide](../../references/authorized-replay.md).

Heron, Land-book, and the linked OpenAI launch page have no component entry because the reference requests returned HTTP 403 during capture. The Framer marketplace entry is a working adaptation of its preview. Install a copy of the marketplace component from its publisher if the project needs that implementation. The local media demos use [bundled sample loops](../../media/preview-loops/README.md).

## Compare six revised components with their sources

Use [the comparison page](compare-fidelity.html) to step through the source footage and interact with the component at matching bounds. Drag the sidebar horizontally and hold midway to compare position. On the archive, open the tray, lift a file, and put it back. The funnel and the flame are live Canvas 2D renderers. The glass is a WebGL scene using the pinned [Three.js 0.169.0 build](three/LICENSE), with a readable HTML fallback.

Prepare the six authorized input videos locally with FFmpeg. The directory must contain the five X exports listed in the catalog. Pass the Facet preview separately.

```sh
node blueprints/reference-components/prepare-fidelity.mjs <authorized-x-clips-directory> <authorized-facet-preview.mp4>
```

The script gives the sidebar its original phone bezel, Quick Actions its actual dashboard image, and the archive three strips of frames for the tray and the two recorded file lifts. Native controls drive the archive strip in both directions. These media files are stored in `private-reference/`, alongside the input clips for comparison. On other installations the scene draws its own artwork from the supplied geometry and data.

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

Find the chosen entry in `catalog.mjs` and open its module from the gallery. Copy the component function, its imports from `shared.mjs`, and the applicable rules from `components.css` or `fidelity.css`. Mount it in a container with class `library-preview` or scope the copied styles to the receiving project's container. Pass the entry's `options` and an `AbortSignal`. Abort when the component unmounts, then remove its DOM.

```js
import { floatingNav } from './navigation.mjs';

const lifetime = new AbortController();
floatingNav(document.querySelector('.library-preview'), { signal: lifetime.signal });
// Call lifetime.abort() before removing the component.
```

Replace sample labels, data, colors, and media for the receiving project. Keep the input, selected state, cancellation, and reduced-motion behavior. For upstream implementations of PanelUI, Loading.dev, Unfold, or Liquid Taffy, start with the [licensed source packages](../../vendor/interaction-packs/README.md).
