# From reference to first build

## Choose the evidence first

Write a short project design plan before opening additional catalogs. Put it in the project's DESIGN.md when the brief asks for one or when the design needs to survive handoff. Otherwise a short working note is enough.

| Decision | Record |
| --- | --- |
| First screen | Audience, promise, primary action, the visible proof, and the relative positions of these four |
| Type and layout | Roles and actual loaded families, display range, body size, grid or rail, content width, desktop and mobile gutters |
| Color | Ground, ink, surface, accent and states, with text contrast checked where it overlays media |
| Media | Subject, crop/focal point, where the media comes from, where it may be used, and a fallback |
| Motion and states | Trigger, start, end, duration or scroll range, interruption, reverse state, and reduced-motion behavior |
| Mobile and verification | What stacks first, what moves to an inline control, required interactions, and viewport checks |

Choose one primary design from the [design library](design-library/INDEX.md) or an explicit reference. Pull one helper pattern when it adds information. Adjust the layout for the new subject's own proportions and content. Use the existing brand system when the project has one. Keep the chosen reference out of the runtime code.

## Study a gallery example

- Landbook is useful for page divisions and section lookup. [Motion was added to website pages](https://land-book.com/changelog). [Landbook's terms](https://land-book.com/terms-of-service) limit use of gallery data. Follow available links and study the original site.
- [Layers](https://layers.to/) surfaces small UI interactions and process details. Its [terms](https://layers.to/legal/terms-and-conditions) require the creator's permission to copy or download their work. Follow the creator link when looking for licensed source material.
- [SEESAW](https://www.seesaw.website/) links to original sites and lists typography. Use it to find a reference with a similar page job. Check the primary source for reusable fonts, media and code.
- [MotionSites](https://motionsites.ai/) offers project prompts, [3D examples](https://motionsites.ai/3d-websites) and [animated backgrounds](https://motionsites.ai/backgrounds). The [terms](https://motionsites.ai/terms) prohibit bulk collection and redistribution of prompts/source. Request only the designs relevant to the current project via the official UI or MCP.
- [GetDesign](https://getdesign.ai/) provides a limited number of free copies and paid access to more DESIGN.md files. Its terms permit licensed project use and restrict scraping and redistribution. Use the copy control within the displayed quota. Check the rights of each separate asset.

Make your own notes with the source URL and observed date, purpose, first-screen hierarchy, media relationship, mobile change, and behavior through one complete interaction. Separate what the browser showed from a proposed implementation value. Use the [website motion studies](site-motion-studies.md) for examples with known source behavior. A title in a gallery is evidence of the category and subject. A measured duration needs timed frames or browser verification.

## Capture and reuse

Public watermarked previews can inform an original study within permitted use. Keep the mark intact on reference captures. Use the [public preview recipes](public-preview-recipes.md) to build new geometry, pacing or media from the visible behavior.

For reference captures you have permission to make, take one stable desktop frame, its mobile counterpart and a short recording for each interaction you need to understand. Record the initial state, one user action, the end state and a reversal or return. Use normal browser controls and preserve the URL, viewport and actions in accompanying notes. If saving a source clip is restricted, record a written observation and film the original implementation instead.

Track reusable third-party files individually with origin, author, license evidence, applicable attribution and permitted use. Link-only sources can inform the written plan. Load project-owned, generated, or explicitly licensed media into the implementation. Check the older [media shelf](../media/MEDIA.md) item by item before use. The [original motion studies](../blueprints/design-motion-studies.html) work locally and include procedural art, CSS depth and a state transition. The [background loop pack](../media/loops/README.md) provides ready-to-use videos and posters.

## MotionSites MCP

MotionSites documents support for Claude, Claude Code and Codex, with OAuth through a MotionSites account. At the November 2026 check its documentation advertised three free prompts and an unauthenticated MCP initialization received HTTP 401. Current access depends on the signed-in account. [Official setup](https://motionsites.ai/mcp).

Claude Code, scoped to the website project:

```bash
claude mcp add --scope local --transport http motionsites https://motionsites.ai/api/mcp
```

Open Claude Code in that project and use /mcp to authorize it. The optional Codex command is:

```bash
codex mcp add motionsites --url https://motionsites.ai/api/mcp
```

Let the connector return matches for the project brief and open the chosen allowed result. Keep its prompt where project use is allowed. When the connector is unavailable, select a local study and carry on with project-owned or verified media. A subscription adds options, and the browser checks for the finished build still apply.

## Verify the first result

Open the actual site at 1440, 768 and about 390px. Inspect the first viewport and the start and end of the main interaction. Verify the main action, one keyboard path and reduced motion. Force the dominant media to fail where practical and check fallback legibility. Fix any blocking issue and the most visible design miss inside the same build run. Treat style findings as defaults for the brief. For example, a CSS product rendering uses gradients to depict material, and an effect that starts on click needs an interaction test. If a style rule conflicts with an explicit design choice, record the rule and the reason, then verify the affected area directly. Keep overflow, broken media, contrast, focus and functionality checks active. For a comparison, give the same brief and assets to the same model in independent sessions, hide the variants' names from the reviewer, and score mobile, visual hierarchy, project specificity, media, interaction and brief fulfillment. Record runtime failures separately from subjective quality.
