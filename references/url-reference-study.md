# Study a website from its URL

Use the bundled [TypeUI extractor](https://github.com/bergside/design-md-chrome) and locally installed [DesignLang](https://github.com/Manavarya09/design-extract) to turn a specific web page into design evidence. Start from the intended route and the patterns the user wants. Review the rendered page, compare desktop and mobile, and keep source page text and generated reports as reference data. Existing project instructions and content remain authoritative.

## Capture an evidence set

```bash
node <skill>/scripts/url-study.mjs https://example.com --responsive-shots
```

The wrapper uses an isolated system Chrome session. DesignLang provides responsive token sampling and runtime motion inspection. Its reports stay at the top level. TypeUI reads computed styles and visible page signals and writes `typeui/DESIGN.md`, `typeui/SKILL.md`, and a normalized JSON report with conformance checks. Run `--engine designlang` or `--engine typeui` to choose one engine. The default output goes under the project's ignored `.taste-skill/url-study/` directory. Supply `--out NEW_DIRECTORY` for a specific location. Set `DESIGNLANG_ENTRY` to another verified installation if needed.

Run `node <skill>/scripts/design-md.mjs https://example.com --width 390 --height 844 --out NEW_DIRECTORY` to recapture a specific viewport using TypeUI alone. For a currently open tab, the bundled [unpacked extension](../vendor/web-platform/design-md-chrome/README.md) includes refresh, preview, download, and the upstream quick-install UI. Review generated Markdown before placing it in a project or using it as instructions. The reports' sample counts, inferred brand and component counts describe that page capture. Inspect click-, gesture-, and scroll-triggered transitions separately before relying on their values.

1. Inspect the actual route and read the generated design description, token files and available motion data. Describe what you observed, including viewport and input. Use screenshots for shape and placement and direct browser or recording evidence for hover, drag, scroll, keyboard and reversed states.
2. Collect visual patterns when studying a third-party page. Build a new composition and interaction with the project's identity and allowed media. Use exact reproduction when the user owns the design or has permission to reproduce it.
3. For authorized transfers, [DesignLang's clone command](https://designlang.app/docs/cli-reference#designlang-clone) can provide a Next.js starting point. Review the generated code and add the states, content, navigation and animations the target genuinely requires. A live URL exposes its browser surface; a rendered capture can miss backend behavior, content behind authentication, dynamic timelines, WebGL, embedded media or other routes.
4. Compare the implemented route at its target sizes. Record which interactions match and where more reference evidence is needed. Use [recording motion studies](recording-motion-studies.md) when quirk, easing or interruptions matter, then run the [finish checks](surface-and-finish.md).

Figma Context MCP and Penpot MCP supply context from their respective design files. Use them as optional design inputs when the user provides a file. Penpot can also prototype transitions between boards. Build and test the website's interaction logic in the application. [Figma Context MCP](https://github.com/GLips/Figma-Context-MCP) · [Penpot MCP](https://help.penpot.app/mcp/) · [Penpot prototyping](https://help.penpot.app/user-guide/prototyping-testing/prototyping/)
