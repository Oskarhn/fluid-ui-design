# Component sources

Use the [component catalog](../blueprints/component-sources/index.html) to find an existing control or visual treatment before building one from scratch. Search by behavior and platform, then read the actual source or linked reference for the chosen entry. Keep the source URL, author when available, and applicable notice with the implementation.

| Source | Catalog material | Start a project |
| --- | --- | --- |
| [Uiverse Galaxy](https://github.com/uiverse-io/galaxy) | The entire published MIT snapshot at `adbd2adde0a299a3956ea288fb444ec01891ca41`. Each of the 3,802 entries keeps its original HTML snippet, original attribution when present, and a link to the element. | Copy the chosen markup and scoped CSS with the [MIT notice](../blueprints/component-sources/uiverse/LICENSE.md). For Tailwind examples, check the source classes against the receiving project's Tailwind version. |
| [ForgeUI.com](https://www.forgeui.com/components/introduction) | Component variants and blocks from the registries linked by the public examples. The catalog links to the vendor preview. The local installation keeps source files and dependency lists for project use. | Select a variant, review its registry dependencies and CSS tokens, then use the registry link from the entry in a compatible shadcn project. |
| [Uilora](https://www.uilora.com/get-started/web/components) | The published CLI registry and distinct web, template, and [mobile documentation](https://www.uilora.com/get-started/mobile/components) routes. The local installation keeps the source returned by free registry entries and the component and usage files exposed by the 24 signed-in mobile code pages. Premium registry entries link to the vendor. | Choose the platform first. Use the published installation command for an unambiguous CLI entry. Check the [terms](https://www.uilora.com/terms) before reusing source. |
| Universe.net | The exact requested domain redirected to a general-interest article during the Chrome check. No component source was located at that address. | Use the intended URL when provided. |

The shared catalog carries ForgeUI and Uilora metadata and links. Their package files sit in `private-source/` in the local installation. The Uilora site permits project use and restricts redistribution of a standalone collection. The ForgeUI introduction describes copying its code into applications. Source displayed in a preview is a starting point for the receiving project.

The imported JSX variants of Uilora's Card Wizard and Vertical Accordion Pagination have syntax errors. Use the TSX variants, which passed the syntax parser in this snapshot. Check the receiving project's types and runtime behavior separately.

## Search from a coding session

```sh
node scripts/find-component-source.mjs "animated hover" --source uiverse
node scripts/find-component-source.mjs "navigation" --source uilora --limit 5
node scripts/find-component-source.mjs --id forgeui:accordion-01 --code
```

Choose the component whose behavior best matches the brief. Review the resting, pressed, focused, loading, disabled, and completed states that the actual task needs. Keep original CSS scoped to its component. Integrate a new version with the project's actual fonts, colors, content and action handlers.

- Use **Uiverse** for small DOM and CSS studies such as checked controls, hover buttons, tiny loaders and patterns. Preserve keyboard focus and native control behavior. Bring over the selectors and keyframes that belong to the component, then apply the receiving site's motion and color settings.
- Use **ForgeUI.com** when the project uses React, shadcn and compatible primitives. Read every file in the registry entry and resolve each dependency before applying its visual variants or block. Bind forms to the real product workflow and test keyboard focus across dialogs, menus and tab lists.
- Use **Uilora** for React and React Native references. Check whether the chosen component needs Framer Motion, Reanimated, Expo, or a peer package. Test native motion on its target device. Use the project's own images and branding when adapting a demo.
- For a transition without reusable source, extract the trigger, motion phases and finish state from the published preview. Apply the [motion composition guide](motion-composition.md) or [Anime.js examples](animejs.md) to implement it against the project's own layout and controls.

## Open and refresh the catalog

```sh
node blueprints/reference-components/test-server.mjs
node blueprints/component-sources/verify.mjs
```

Open `/blueprints/component-sources/index.html` on the library server. The Uiverse preview runs HTML, CSS and precompiled Tailwind utilities in a script-free isolated frame. Use the original when a snippet relies on externally hosted assets or browser behavior outside the preview. The code viewer always exposes the archived source separately from the restricted preview.

To rebuild, check out the pinned official Galaxy revision and pass its folder to the importer. The optional second argument selects `uiverse`, `forgeui`, `uilora` or `all`. A Uilora refresh can add `--reuse` after the source name to keep existing files from the same registry URL. The script stops issuing new requests to a source after a repeated rate-limit response.

```sh
node scripts/import-component-catalog.mjs /path/to/galaxy all
```

The local Tailwind preview uses Tailwind CSS 3.4.17 against the Galaxy HTML files. Keep the [Tailwind license](../blueprints/component-sources/uiverse/TAILWIND-LICENSE.md) with its compiled utilities. To rebuild it, set an input CSS file with `@tailwind base;` and `@tailwind utilities;`, then compile against `/path/to/galaxy/**/*.html` with `--minify`. Output the result to `blueprints/component-sources/uiverse/tailwind.css`. Browser checks use Chrome and the existing `PLAYWRIGHT_MODULE` override when needed.
