# Surface decisions and finish checks

Use these checks for a new surface or meaningful visual refinement. For a narrow fix, use the parts that apply to the change.

## Establish what the project knows

Read the request, the working interface or its current evidence, and any project design records. Use an existing `PRODUCT.md` for audience, task, constraints and documented facts. Use an existing `DESIGN.md` for typography, layout, palette, motion and components. Start with the implemented design when a design record is missing. For a small task, record only the context it needs in a working note.

Decide whether the request calls for refining an existing visual identity or replacing it. For refinement, keep the project's working interaction, factual copy and visual commitments unless the user requests a change. Capture the starting surface at the relevant sizes before editing when possible. For a redesign, carry forward the tasks, constraints and verified facts. Keep sample data clearly identified.

## Choose what the visitor needs to do

Use the surface's job, including when a single product offers several different surfaces.

| Main job | Design decision | Verification |
| --- | --- | --- |
| Decide | Show the offer, the closest available proof and a direct action. Make the first screen recognizably about this subject. | A new visitor can name the offer and reach the action on desktop and mobile. |
| Operate | Use familiar controls and group information around the task. Show feedback and the next available action. See [app screens](app-screens.md). | Follow the common task and an applicable recovery path. Check that input, focus and data survive a state change. |
| Read | Put the answer, section hierarchy and navigation in reading order. Use imagery only where it helps understanding. | Check narrow text reflow, long headings, links and orientation. |
| Explore | Let the artifact, scene or content lead. Use controls when the visitor needs to pause, change focus or step forward. | Inspect the focal subject and important interaction states at the sizes that ship. |

Apply [design defaults](design-defaults.md) and the brief when choosing visual treatment and motion. Document meaningful style exceptions with the reason.

If you use a [behavioral pattern](behavioral-design.md), check the decision or action it supports. For example, verify that a buyer can compare total prices or that a person can edit a goal and stop reminders.

## Verify the state that will ship

1. Choose one primary visitor action and one likely failure or edge case. Pick cases that the surface can actually reach. For a form this can be long input and a failed submit; for a gallery it can be a missing image and keyboard selection.
2. Run the current build and capture the actual route, not just a source shell. Test normal and narrow layout, plus an affected keyboard and touch path. Check long or localized copy, and loading, empty, error, retry or reduced-motion behavior when any of them apply. Check iOS and Android in the relevant emulator or device when building a native surface.
3. For a web build, produce a fresh measurement report and screenshots with the [browser inspector](../scripts/inspect.mjs).

```bash
node <skill>/scripts/inspect.mjs <local-url-or-file> --finish --out .taste-skill/inspect
```

Use `--app` for an operational web workspace and `--widths` when specific target widths need coverage. The finish check adds evidence for page load, browser-reported HTTP errors, uncaught JavaScript exceptions and screenshots. Review captured layout and interaction yourself. Compare to the pre-change capture on a redesign. For a site with several relevant routes, repeat the check on each route in a separate output directory.

4. For a new site or a performance-sensitive change, run [Chrome Lighthouse](web-performance.md) against the served build. Keep comparable before and after reports and exercise the main action separately on a throttled mobile connection. If an earlier baseline is unavailable, report the current measurement.

Record the route, widths and checks that ran. Address issues that prevent the user from completing the task, then fix the biggest visual issues together. Recheck the current build. In the handoff, give the evidence and any remaining gaps. The report measures the rendered route; task success and visual quality still require inspection.

## Sources

The context and surface decisions draw on [Impeccable's canonical skill](https://github.com/pbakaus/impeccable/blob/9e460a87ef338ee9d12c7beed8fedc597a5af5f7/skill/SKILL.src.md) and its [production hardening reference](https://github.com/pbakaus/impeccable/blob/9e460a87ef338ee9d12c7beed8fedc597a5af5f7/skill/reference/harden.md). The browser finish approach draws on [Taste Skill](https://github.com/Leonxlnx/taste-skill/blob/d1a2bb41d927083ac7118f60cfc9cdf711810ea0/skills/taste-skill/SKILL.md). Fluid UI Design uses its own inspector and existing design defaults.
