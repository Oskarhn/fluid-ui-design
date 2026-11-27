# Runnable reference components

Use the [catalog](catalog.mjs) to look up a reference by its URL, author, or behavior. The [interactive gallery](index.html) includes 88 entries built from 35 component implementations. It also links to the [11 Craft controls](../interaction-controls/index.html) and the [12 original Bencho blocks](../bencho/README.md).

| Collection | What runs |
| --- | --- |
| X motion studies | Fifteen components, one per supplied clip. They include the collapsing sidebar, action tiles, conversion funnel, archive drawer, dismissal stack, validation code, and layered onboarding. |
| Website interactions | Thirty-eight examples. Try the venue player, the restaurant ingredient disclosure, the pricing switch, the Venice hover and light change, and the Wabi deck. |
| Reference galleries | Ten search, filtering, preview, or background controls. |
| Bencho finds | Twenty-two examples. Try the route switch, copier, calendar, card tray, status controls, sliders, or connected views. |
| Supplied prompts | Three effects. Try the video backdrop, a fading Canvas 2D pointer mask, and a CSS glass panel with a breakaway and return transition. |

Each entry links to its reference or supplied-brief notes and to the component module. Multiple examples can use the same state model with different project data. An example covers the actions listed in its description. Screenshots, site-specific assets, account states, and complete website exports have separate coverage in the [site studies](../../references/website-and-control-studies.md) and [browser replay guide](../../references/authorized-replay.md).

Heron, Land-book, and the linked OpenAI launch page have no component entry because the reference requests returned HTTP 403 during capture. The Framer marketplace entry is a working adaptation of its preview. Install a copy of the marketplace component from its publisher if the project needs that implementation. The local media demos use [bundled sample loops](../../media/preview-loops/README.md). The glass example is the HTML and CSS version of the prompt, with no mandatory WebGL dependency.

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

Find the chosen entry in `catalog.mjs` and open its module from the gallery. Copy the component function, its imports from `shared.mjs`, and the applicable rules from `components.css`. Mount it in a container with class `library-preview` or scope the copied styles to the receiving project's container. Pass the entry's `options` and an `AbortSignal`. Abort when the component unmounts, then remove its DOM.

```js
import { floatingNav } from './navigation.mjs';

const lifetime = new AbortController();
floatingNav(document.querySelector('.library-preview'), { signal: lifetime.signal });
// Call lifetime.abort() before removing the component.
```

Replace sample labels, data, colors, and media for the receiving project. Keep the input, selected state, cancellation, and reduced-motion behavior. For upstream implementations of PanelUI, Loading.dev, Unfold, or Liquid Taffy, start with the [licensed source packages](../../vendor/interaction-packs/README.md).
