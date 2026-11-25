# Measure web performance with Lighthouse

Run Chrome Lighthouse on the implemented route for new websites and changes that affect loading, layout stability, or interaction speed. Serve the production build over HTTP or HTTPS. Use the same device profile, network and CPU settings, Chrome and Lighthouse versions, cache state, and page content for both measurements.

## Measure before editing

- For an existing site, save the baseline before changing it. For a new site, measure the first complete build before the performance pass. Record the route, build, test profile, and date. If no earlier baseline exists, report the current measurement and say which comparison is missing.
- Start with Lighthouse's mobile profile on a cold load. Run both versions in the same environment, one test at a time. Take at least three runs per version when practical and compare medians. If a change is small relative to the spread across runs, take more measurements before drawing a conclusion.
- Open the report's Insights and the Chrome DevTools waterfall. Identify the LCP element and what held it back, which elements shifted, and which scripts or third parties blocked the main thread. Fix the largest bottlenecks with measurable impact on the route.

## Spend the loading budget where it matters

| Problem | What to change and verify |
| --- | --- |
| Oversized images | Export responsive sizes and compare AVIF, WebP, or the original format at the same visible quality. Set `srcset` and `sizes` to match the layout. Keep useful alt text and a stable aspect ratio. |
| Late first-screen content | Put the LCP image in the initial HTML and let it load eagerly. Use `fetchpriority="high"` for that image when it needs a priority boost. Lazy-load genuinely offscreen images and embeds that can wait. For offscreen video, leave a poster or a usable placeholder and avoid fetching the full stream at startup. |
| Delaying scripts or unused code | Use Coverage and the network trace to find candidates across the actual routes and states. Remove dead dependencies and redundant third-party scripts. Split route-specific code, and defer code the first screen and its main interaction can do without. Check that the critical flow still works. |
| Slow fonts | Serve only useful weights and language subsets in WOFF2 when the browser target allows it. Choose `font-display` and fallback font metrics for readable text and stable layout. Preload only fonts that the first screen demonstrably needs early. |
| Repeat downloads | Inspect actual response headers. Use long-lived public cache headers for public, content-hashed assets. Choose a separate policy for HTML, changing URLs, and private responses. Test a repeat visit separately from the cold-load baseline. |
| Layout shifts | Reserve space for images, video, embeds, and async content. Keep font changes and status messages from moving controls a user might already be about to touch. Check while scrolling and during interaction as well as at load. |
| Slow input | Exercise the primary user action with Chrome DevTools open under the same mobile constraints. Trace input delay, handler work, and rendering. Break up long tasks and avoid unnecessary layout or drawing. Use field INP from CrUX or existing real-user monitoring when available. Lighthouse's navigation TBT reports startup blocking and has a different scope. |

Use the bundled guidance with `node <skill>/scripts/web-guidance.mjs search "improve largest contentful paint"` and retrieve the matching guides. Preserve the first-screen composition, accessibility, and the user's action while making changes.

## Run and compare the reports

Open the **Lighthouse** panel in Chrome DevTools and select **Navigation**, **Mobile**, and **Performance**, or use the CLI. This example pins Lighthouse 13.6.0 and needs Node 22.19 or later and Chrome. Use a new output directory for each side of the comparison.

```sh
npx --yes lighthouse@13.6.0 http://localhost:3000/ --only-categories=performance --form-factor=mobile --throttling-method=simulate --chrome-flags=--headless --output=html --output=json --output-path=.taste-skill/lighthouse/before/run-1
```

Create the output directory first. Repeat with distinct run names through `run-3`. After fixing the bottlenecks, run the same command against the updated build into `after` with the same settings. Keep only the Lighthouse navigation JSON exports for that test in each directory alongside their HTML reports.

```sh
node <skill>/scripts/compare-lighthouse.mjs .taste-skill/lighthouse/before .taste-skill/lighthouse/after
```

The script prints the median performance score, LCP, TBT, CLS, transfer size, and the difference for each. Review the raw reports if the change is close to run-to-run variation. State which changes improved the route, link the before and after reports, and list remaining issues. Use DevTools Network and Performance for a separate slow-mobile walkthrough of the main action. Describe Lighthouse results as lab results, even when they use a mobile profile. Report real-user Core Web Vitals separately when data are available.

[Chrome Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) · [Test variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md) · [Optimize LCP](https://web.dev/articles/optimize-lcp) · [Optimize CLS](https://web.dev/articles/optimize-cls) · [Optimize INP](https://web.dev/articles/optimize-inp)
