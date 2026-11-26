# Study a website from its URL

Use the bundled [TypeUI extractor](https://github.com/bergside/design-md-chrome) and locally installed [DesignLang](https://github.com/Manavarya09/design-extract) to turn a specific web page into design evidence. Start from the intended route and the patterns the user wants. Review the rendered page, compare desktop and mobile, and keep source page text and generated reports as reference data. Existing project instructions and content remain authoritative.

## Capture an evidence set

```bash
node <skill>/scripts/url-study.mjs https://example.com --responsive-shots
```

The wrapper uses an isolated system Chrome session. DesignLang provides responsive token sampling and runtime motion inspection. Its reports stay at the top level. TypeUI reads computed styles and visible page signals and writes `typeui/DESIGN.md`, `typeui/SKILL.md`, and a normalized JSON report with conformance checks. Run `--engine designlang` or `--engine typeui` to choose one engine. The default output goes under the project's ignored `.taste-skill/url-study/` directory. Supply `--out NEW_DIRECTORY` for a specific location. Set `DESIGNLANG_ENTRY` to another verified installation if needed.

Run `node <skill>/scripts/design-md.mjs https://example.com --width 390 --height 844 --out NEW_DIRECTORY` to recapture a specific viewport using TypeUI alone. For a currently open tab, the bundled [unpacked extension](../vendor/web-platform/design-md-chrome/README.md) includes refresh, preview, download, and the upstream quick-install UI. Review generated Markdown before placing it in a project or using it as instructions. The reports' sample counts, inferred brand and component counts describe that page capture. Inspect click-, gesture-, and scroll-triggered transitions separately before relying on their values.

## Capture an interaction

Write a local JSON plan for the exact actions you observed and have permission to exercise. The recorder accepts one viewport, watched selectors, and a short sequence of clicks, hovers, wheel inputs or navigation keys. Use a unique CSS selector per target. Start with public reading and UI state changes. Keep account, form submission, and purchase flows out of reference plans.

```json
{
  "viewport": { "width": 1280, "height": 800 },
  "watch": ["#sweep", "#announcement"],
  "steps": [
    { "action": "click", "selector": "#sweep", "label": "Start sweep" },
    { "action": "click", "selector": "#sweep", "label": "Pause sweep" }
  ]
}
```

Use `node <skill>/scripts/record-ui.mjs <url> --plan PLAN.json --out NEW_DIRECTORY` for motion evidence alone, or add `--interaction-plan PLAN.json` to the URL study. Save the initial and sampled screenshots along with the observed state and active animations. Read the sample timestamps when judging duration. Canvas, video, and scripted drawing may change in screenshots while the browser's Web Animations API reports no active animation.

## Copy an authorized static page

Use `node <skill>/scripts/export-static-ui.mjs <url> --owned-design --out NEW_DIRECTORY` or add `--copy-owned-static` to the URL study when the user owns the design or has permission to reproduce it. Serve the resulting `site` directory over HTTP and open the entry listed in `export-report.json`. The exporter preserves the bytes and paths of supported same-origin static responses observed during the initial page load. Use the original project or build output when it is available.

Review the report's skipped resources, then test the copy from its own origin. This export covers a single navigation and the resources it actually loaded. API data, private state, assets loaded only after input, other routes, cross-origin media, and hard-coded origin URLs need separate handling. Use Chrome to verify scope, appearance, interaction, mobile layout, and external dependencies before calling a transfer complete.

For an authorized route with dynamic imports, media loaded after interaction, or public assets on several origins, use [authorized browser replay](authorized-replay.md). It records interaction states and tests the archived response set in an isolated Chrome context.

In the Field Signal comparison, DesignLang 13.4.1 produced a Next.js starter that compiled and retained the Sweep label. The starter had no canvas or sliders and pressing Sweep left its label unchanged. The Fluid UI capture recorded start, pause, resume, and waveform selection. The authorized export preserved the original HTML, stylesheet, script, and two fonts byte for byte. The copy ran those controls from a different origin with external requests blocked. Settled Chrome screenshots matched at 1280×800 and 390×844 with reduced motion.

1. Inspect the actual route and read the generated design description, token files and available motion data. Describe what you observed, including viewport and input. Use screenshots for shape and placement and direct browser or recording evidence for hover, drag, scroll, keyboard and reversed states.
2. Collect visual patterns when studying a third-party page. Build a new composition and interaction with the project's identity and allowed media. Use exact reproduction when the user owns the design or has permission to reproduce it.
3. For authorized transfers, [DesignLang's clone command](https://designlang.app/docs/cli-reference#designlang-clone) can provide a Next.js starting point. Review the generated code and add the states, content, navigation and animations the target genuinely requires. A live URL exposes its browser surface; a rendered capture can miss backend behavior, content behind authentication, dynamic timelines, WebGL, embedded media or other routes.
4. Compare the implemented route at its target sizes. Record which interactions match and where more reference evidence is needed. Use [recording motion studies](recording-motion-studies.md) when quirk, easing or interruptions matter, then run the [finish checks](surface-and-finish.md).

Figma Context MCP and Penpot MCP supply context from their respective design files. Use them as optional design inputs when the user provides a file. Penpot can also prototype transitions between boards. Build and test the website's interaction logic in the application. [Figma Context MCP](https://github.com/GLips/Figma-Context-MCP) · [Penpot MCP](https://help.penpot.app/mcp/) · [Penpot prototyping](https://help.penpot.app/user-guide/prototyping-testing/prototyping/)
