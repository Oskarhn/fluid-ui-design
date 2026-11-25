# Bencho motion blocks

Twelve React blocks corresponding to the components in the supplied reference. The source comes from Bencho's [MIT repository at commit 84dfcee](https://github.com/cabralorenzo/bencho/tree/84dfcee170171257a28631402d37ff34900bc773). Keep [Lorenzo Cabra's license](LICENSE) with copies of the source. Bencho Finds is a separate gallery credited to the original designers.

| Component | Source | What to study |
| --- | --- | --- |
| Card swap | [CardSwap](blocks/card-swap/README.md) | Stable card identity, fixed slots, paint order, drag threshold |
| Stacked bars | [StackedBars](blocks/stacked-bars/README.md) | Interpolating chart values and a following tooltip |
| Wake slider | [WakeSlider](blocks/wake-slider/README.md) | A single value with a trailing visual response |
| Context meter | [ContextMeter](blocks/context-meter/README.md) | Proportional data, selection and two representations |
| ASCII wake | [AsciiWake](blocks/ascii-wake/README.md) | ASCII projection, pointer influence and decay |
| Toast stack | [ToastStack](blocks/toast-stack/README.md) | Layout continuity through expand, dismiss and collapse |
| Folding bill | [FoldingBill](blocks/folding-bill/README.md) | A deforming mesh responding to the grab point |
| Rolling counter | [Counter](blocks/rolling-counter/README.md) | Carry, per-digit motion and number semantics |
| Image compare | [Compare](blocks/image-compare/README.md) | A shared seam between registered images |
| Particles | [Particles](blocks/particles/README.md) | Per-point displacement about a home position |
| Image accordion | [Accordion](blocks/image-accordion/README.md) | Redistributing a fixed width around one active item |
| Time scrubber | [Scrub](blocks/time-scrubber/README.md) | Fixed cursor with data and ruler moving underneath |

## Try the blocks

Run `npm ci` and `npm run dev` in this folder. The [preview source](demo/preview.tsx) mounts one study at a time and includes a separate original materials example. `npm run build` type-checks the components and builds the preview.

Copy an individual TSX and CSS pair and install the dependencies listed in its README. Import [tokens.css](tokens.css) if you need an adapter. It scopes its defaults to a `.fluid-motion` host. Map `--motion-ground`, `--motion-surface`, `--motion-ink`, `--motion-ink-rgb`, `--motion-font`, and `--motion-accent` to the project's existing roles. For a token ending in `-rgb`, match the receiving declaration's expected format. `--t` on CardSwap is written per card by the slot calculation.

CardSwap accepts an `images` map with the keys `mount`, `bloom`, `peak`, and `wings`. The supplied version has local color fallbacks and a keyboard action. Compare accepts `before` and `after` URLs for two aligned images, with optional `monochromeBefore` for a shared frame. The preview supplies original backgrounds from this repo. The other image examples use the upstream placeholders.

Read [motion composition](../../references/motion-composition.md) before borrowing an effect for a different action. The bench preview is an interaction study. When using a block as a product control, test the exact keyboard path, accessible state, responsive dimensions and reduced-motion behavior in the product.
