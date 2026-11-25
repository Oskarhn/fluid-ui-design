# Motion library source checkouts

This directory is the local source library for GSAP, Lenis, and React Bits. Each checkout keeps its own Git metadata, source layout and licensing. The integration guide and pinned upstream references stay portable with Fluid UI Design. The complete checkouts are ignored by the parent Git repository.

| Library | Pinned source | Where to start locally | Terms |
| --- | --- | --- | --- |
| GSAP | [5e6c35f](https://github.com/greensock/GSAP/tree/5e6c35ff8eedea12d4f229129def635277d8b0f2) | `gsap/src/gsap-core.js`, `gsap/src/ScrollTrigger.js`, `gsap/src/Flip.js`, `gsap/src/Draggable.js`, `gsap/types/` | [Standard GSAP License](https://gsap.com/community/standard-license/) |
| Lenis | [b82992b](https://github.com/darkroomengineering/lenis/tree/b82992bba89448228402312da1cad27ce2428d7c) | `lenis/packages/core/src/`, `lenis/packages/core/lenis.css`, `lenis/packages/react/`, `lenis/packages/vue/`, `lenis/playground/` | [MIT](https://github.com/darkroomengineering/lenis/blob/b82992bba89448228402312da1cad27ce2428d7c/LICENSE) |
| React Bits | [37f53df](https://github.com/DavidHDev/react-bits/tree/37f53df7efb61238b0fea9ea8be74e3cce62b959) | `react-bits/src/content/` (JS/CSS), `src/tailwind/` (JS/Tailwind), `src/ts-default/` (TS/CSS), `src/ts-tailwind/` (TS/Tailwind), and `public/r/` for registry entries. Paths starting with `src/` or `public/` are relative to React Bits. | [MIT + Commons Clause](https://github.com/DavidHDev/react-bits/blob/37f53df7efb61238b0fea9ea8be74e3cce62b959/LICENSE.md) |
| DesignLang | [189d5ea](https://github.com/Manavarya09/design-extract/tree/189d5ea0aed63977f4e6d9495b9d9cf4524fae49) | `designlang/bin/design-extract.js` and the [URL study workflow](../../references/url-reference-study.md). Local CLI version 13.4.1. | [MIT](https://github.com/Manavarya09/design-extract/blob/189d5ea0aed63977f4e6d9495b9d9cf4524fae49/LICENSE) |

## Choose according to the interaction

- **GSAP** fits coordinated timelines, shared-element layout changes with Flip, and deliberate scroll-linked changes. Start with a defined rest state, one owner for the timeline, and teardown for each context. Preserve meaningful content under reduced motion.
- **Lenis** fits deliberate scroll interpolation. Start with native scrolling and include Lenis when the composition needs it. Keep keyboard and anchor navigation, modal and nested scrolling, and mobile behavior testable. For a GSAP ticker integration, have the ticker own the Lenis clock with `autoRaf` off, convert ticker seconds to milliseconds, and remove the callback on cleanup. See the versioned README for ScrollTrigger synchronization.
- **React Bits** fits scoped, ready-made effects. Choose the component and implementation variant that match the project's framework, CSS and dependencies. Audit the component's input methods, placement, text legibility, mobile fallback and reduced motion before using it. Keep the original notices and include a component only within the scope of its terms.

Use the [design defaults](../../references/design-defaults.md) when selecting effects. The [recording studies](../../references/recording-motion-studies.md) can help turn a reference into a testable interaction.

On another machine, clone the upstream repository under this directory and check out its pinned revision. Use the upstream link when a local checkout is unavailable. The existing site or app owns the dependencies it actually uses.
