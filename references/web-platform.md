# Modern web implementation

Use the [complete bundled Modern Web Guidance release](../vendor/web-platform/modern-web-guidance/README.md) for browser-side work. Node 22 or newer runs the official CLI, search index and guide corpus locally.

1. Before picking APIs or libraries, search for each user-facing capability in two to five English words. Use browser terms such as `open confirmation dialog`, `accessible range slider` or `respect reduced motion`.
2. Retrieve the matching IDs and applicable discipline guides. If a query misses, try the concrete HTML or browser primitive before scanning the catalog.
3. Follow the project's browser support policy. Use Baseline Widely available as the default and read the retrieved fallback guidance for newer APIs. Adapt examples to the existing stack and keep semantics, keyboard operation and touch. Choose a library when it covers a concrete gap.
4. Test the result in a browser, including the user action, relevant focus states and any fallback. Scan a codebase for legacy patterns only for an explicit modernization or legacy-scan task, and validate each match against upstream guidance before changing behavior.

```sh
node <skill>/scripts/web-guidance.mjs search "respect reduced motion"
node <skill>/scripts/web-guidance.mjs retrieve motion,accessibility
node <skill>/scripts/web-guidance.mjs list
```

Read the full output file when the CLI writes a guide there. For new or changing platform APIs, verify current compatibility against the browser targets and current documentation. [Chrome for Developers](https://developer.chrome.com/docs/modern-web-guidance/get-started)
