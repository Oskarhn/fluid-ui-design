# Compare an authorized frontend with its original

Start with the published component code or shipped assets when the user can reuse them. Preserve the original subject, typography, media crop, hierarchy, and animation state before changing color or composition. A recreation needs an observed baseline and the same input path, such as a wheel gesture, a tab change, a cancellation, or a drag.

## Choose the source

| Available source | How to proceed |
| --- | --- |
| Project source, an npm package, or an explicit public Source panel | Use the original implementation and its supported dependencies. Compare the first runnable copy with the original before extracting a configurable component. |
| Public frontend responses | Archive the downloaded HTML, CSS, fonts, JavaScript and media. Exercise the relevant states while Chrome records resources that load late. Replay the archive in a fresh Chrome context with live network requests blocked. |
| An authorized clip | Keep the original file or remux the original stream. Compare decoded frames at the same timestamp. When the brief calls for a new interactive implementation, derive its input and state changes from the clip and verify them independently. |

Keep captures and copied third-party resources in the authorized project's private output. Ship the method and reusable recipes with the skill. Use [licensed interaction packs](../vendor/interaction-packs/README.md) directly when their terms cover the intended reuse.

## Capture, inspect, and open the copy

Use Node 22 or newer, system Chrome, and Playwright available to the skill or working project. If Playwright is installed elsewhere, set `PLAYWRIGHT_MODULE` to that installation's package directory.

```sh
node <skill>/scripts/replay-ui.mjs capture https://example.com --owned-design --out .taste-skill/example-replay --plan replay-plan.json
node <skill>/scripts/replay-ui.mjs inspect .taste-skill/example-replay
node <skill>/scripts/replay-ui.mjs open .taste-skill/example-replay
```

```json
{
  "viewport": { "width": 1280, "height": 800 },
  "steps": [
    { "action": "click", "role": "tab", "name": "Source", "label": "Read the published source", "readSource": true },
    { "action": "click", "role": "tab", "name": "Preview" },
    { "action": "click", "role": "button", "name": "Save changes", "label": "Start the demo", "waitMs": 420 }
  ]
}
```

Use either a unique CSS selector or an accessible role and name. The plan also accepts scroll, hover, navigation keys, and fills with synthetic values. A drag uses explicit accessible names for both controls. Use real pointer input for moving elements. Keep forms, purchases, and account actions out of reference plans. The optional `fakeMedia` flag supplies Chrome's test device to an explicitly selected recording demo.

Give a key step a selector when the focus target matters. For example, use `{"action":"key","key":"ArrowRight","selector":"input[type=range]"}` on a page with one slider. Check the starting and ending values in both receipts.

For partially covered targets, inspect a visible part of the control and give the click or hover a relative pointer position. `"pointer": true, "point": [0.18, 0.5]` aims 18% across and halfway down. The point must hit the control or one of its children. If hover temporarily replaces the control, record the hover and wait for it to return before clicking. Check the state after the click.

The capture records same-origin application responses, public static CDN assets, and original video files when they are available. The replay uses the source URLs in an isolated Chrome window so relative imports and navigation keep working. Missing requests remain blocked and are listed in the receipt. The browser profile starts without the user's cookies, and the archive keeps neither cookie headers nor credentials. Range requests are served from verified full media files when available.

A client-side navigation may fetch a framework payload with a session-specific URL. Save the full HTML for routes the plan actually visits so the browser can fall back to document navigation during replay. The receipt marks stills taken through Chrome's screenshot protocol after a normal screenshot times out. Check those frames for unfinished fonts or media.

For an editable static page served from a new host, use the [static export](url-reference-study.md). A browser replay is useful when rewriting a frontend with framework data, dynamic imports or several asset origins would change the behavior being compared.

## Verify before extending it

- Open the original and copy at the same viewport. Compare typography, heading placement, color roles, media crop, and what stays fixed during scroll. Resolve meaningful differences before adding new content or styling.
- Repeat the same user action. Compare the state before it, while it is moving, and at rest. Use a short wait for early motion and a longer wait for the settled result. An executed action still needs a state check.
- Keep separate plans for links on desktop and expandable menus on mobile. Check the destination URL for the link and the open state for the menu. For a wheel gesture with no change in document scroll, check whether a nested scroller, canvas, or fixed animation moved before calling it a match.
- When a Source panel was captured, compare its visible code from both runs. The PanelUI and Loading archives can also be installed directly as dependencies, with their upstream licenses.
- Review missing graphics, dynamic branding, playback, and blocked pages separately. Preserve the actual differences in the report. A template page, API dependency, or private route can require a source handoff to reproduce outside the recorded actions.
- Test responsiveness and reduced motion where they matter to the new page.

### Check nested scroll, translated specimens and filters

A capture plan can set `openingWaitMs` for a slow-loading public demo. Add an `observe` list with a name, a CSS selector and a reading such as `scrollTop`, `left`, `count` or `checked`. Add an `expect` object to the relevant step. A recorded click only qualifies when its expected result appears in both the original and local replay.

For example, this plan checks the scroll position of a nested container.

```json
{
  "observe": [{"name":"offset","selector":"main .scroll-root","read":"scrollTop"}],
  "steps": [{
    "action":"scroll",
    "delta":600,
    "waitMs":1400,
    "label":"Scroll to the next chapter",
    "expect":{"offset":600}
  }]
}
```

For a horizontal specimen moved by a wheel gesture, observe the specimen track's `left` coordinate. For a portfolio filter, observe the number of laid-out matching result cards and whether the intended radio is checked. Compare a filtered state and a return to the full list.

## What the recovered clips show

These observations are from the original playable videos. Use the notes to choose what to measure in a new implementation.

| Clip | Visible mechanism |
| --- | --- |
| [Iconists menu](https://x.com/iconists/status/2125150712216863014) | The icon strokes change shape as the side panel begins to occupy space. Keep the trigger anchored and update the accessible open state with the panel. |
| [Justyna's drawer](https://x.com/justynabuilds/status/2114725547209314359) | The housing holds still while the drawer face and the layered work move out from it. Give the drawer one position and preserve the depth order of the items. |
| [Aditya's stack](https://x.com/AdityaSur11/status/2101529283810210252) | A small stack assembles on a fixed baseline. The status line has its own reading order below the animation. |
| [Jakub's progress layers](https://x.com/jakubkrehel/status/2038645821537722726) | Three tilted planes stay in place while the active plane changes color. Keep the underlying step state independent of the layers. |
| [Tiago's dismissal](https://x.com/tcosta/status/2097385373584203921) | A second card is already behind the top card. The next message settles into the same reading position after the top card leaves. Keep list order and dismissal state separate from the visual treatment. |

The local comparison verified all fifteen original X clips at the sampled time. The clips preserve the pixels of the recorded animations. A working button, drag, or state machine still needs original code or a separately tested implementation.
