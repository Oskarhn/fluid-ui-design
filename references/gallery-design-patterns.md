# Study a design gallery and its interactions

Use this workflow when a gallery can answer a specific design question. For example, look for a way to give the price and product photo equal emphasis, compare how pricing information is grouped, or find a readable type pairing for a portfolio.

## Pick the right reference

| Design question | Useful A1 route or tool | What to study |
| --- | --- | --- |
| How should a page establish its hierarchy and rhythm? | [Websites](https://www.a1.gallery/) or `get_design_brief` | Compare the visible promise, dominant subject and action on a few comparable sites. Use the brief's ranges as a starting point for type and spacing. |
| How should one section read? | [Sections](https://www.a1.gallery/sections) or `search_sections` | Compare the order of the headline, proof, controls, and action. A short query and a section type such as hero, pricing, FAQ, or CTA narrow the results. |
| What belongs on the whole destination? | [Pages](https://www.a1.gallery/pages) or `search_pages` | Read the page top to bottom. Identify what a pricing, about, or case study page needs to answer and where its next step sits. |
| Is there a starting template for the project's stack? | [Templates](https://www.a1.gallery/templates) | Follow the publisher link. Check the platform, real purchase or download terms, and whether mobile and interactive states are included before adopting it. |
| Who made the reference and what is their wider work? | [Profiles](https://www.a1.gallery/profiles) or `get_creator` | Follow the creator's attribution and portfolio. Use the creator's explanations and original project links to understand why a technique was used. |
| Which font pairing suits the job? | `find_font_pairings` | Look at pairings in context. Verify the font's license and test the intended language, weight, and screen size with the new copy. |

Use the connected A1 MCP for a small set of references that serve the current brief. Look first for an appropriate whole page or section, then inspect the original site when scrolling, input, or media behavior matters. Keep source links with your notes and express the reusable principle in your own words. Follow the creator's terms for individual assets and A1's terms for its gallery data. The skill ships original instructions and examples. [A1 MCP](https://www.a1.gallery/mcp) · [A1 terms](https://www.a1.gallery/terms)

## Transfer the interaction, then choose the visual treatment

| Surface | Rule for a new design | Check in a browser |
| --- | --- | --- |
| A browseable catalogue | Keep the hierarchy and crop stable. Put durable categories in the navigation and let the visible results update without losing the user's place. Save useful filter state in the URL. | Apply a filter, reload its URL, go back, and check that both the results and active control agree. |
| Media cards | Reserve the preview ratio. Give the card a readable title and a familiar link. Use a small visual response on fine-pointer hover when it makes the target easier to recognize. | Verify keyboard focus, touch activation, and readable text with reduced motion. |
| Reference detail | Show the visual first and put the information that explains it beside or below it. Keep the source or next action reachable. Put deep detail behind a separate action or page. | Check the layout with long names, missing assets, and a narrow screen. |
| Command search | Provide a visible Search action and use a shortcut as a quicker entry. Move focus to the search field, keep the dialog named, and allow Escape and an explicit close action. | Open with mouse and keyboard, type a query, test no results, close, and verify where focus returns. |
| Preview playback | Show a still first. Load the video when the user asks to play, keep a pause path, and release playback when the preview closes. | Verify that browse and preview opening work before any video request. Test playback, close, and an unavailable video. |
| Billing or variant switch | Keep the labels, scope, price, and next action anchored while the selected value updates. Animate the changed value when the motion helps explain the switch. | Test a quick reversal. Check that selection, displayed price, billing cadence, and checkout destination agree. |
| Responsive previews | Choose the number of columns by whether the image and label remain readable. Let media keep its geometry and let the toolbar wrap. | Check portrait and narrow widths with an active filter and an open overlay. |

## Observed in Chrome

On 26 November 2026, a sampled A1 section card triggered CSS opacity transitions with 200 ms declared durations and a 300 ms transform. The search panel declared a 200 ms entry and focused its input when opened. Escape closed it in the sampled run, and focus returned to a different place. In the local example, the native dialog returns focus to the Search button. Changing the billing interval triggered 200 ms colour transitions and a longer 550 ms transform on the pricing page. These are declared durations from the observed actions. The complete motion on featured sites requires checking those sites directly. [A1 Sections](https://www.a1.gallery/sections) · [A1 MCP and search](https://www.a1.gallery/mcp) · [A1 Pricing](https://www.a1.gallery/pricing)

Use a different motion duration when your content, input, or distance needs it. Keep the resting layout useful while media loads and when reduced motion is enabled. For multi-stage animation, record the first visible change, what stays anchored, and what happens when the action is reversed. [Recording studies](recording-motion-studies.md)

[Open the original motion-loop library](../blueprints/motion-loop-library/index.html) to try a shareable filter, keyboard search, still-first previews, and local motion effects with the skill's own loop assets.
