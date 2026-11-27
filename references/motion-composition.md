# Motion composition

Start with the action and the information that changes. Record the states the user can observe, which element keeps its identity, and what happens if the user changes direction before settling. Then choose one mechanism below. Add visual layers only when they communicate the change.

| Mechanism | State and proof | Adapt it |
| --- | --- | --- |
| Slot permutation | Store an ordered list of stable IDs. A slot supplies position, depth and paint order. Change order once on commit. | Use a card stack for samples or the same mapping for layered product parts, a pinned toolbar or overlapping preview panels. |
| Motion behind a slider | The input has one authoritative value. Draw a spring or wake behind that value. | Volume, timeline, color weight, blur amount or 3D rotation. The live number and keyboard changes follow the same value. |
| Local force around a pointer | Each point has a home position. Apply a bounded radial force and decay back to rest. | ASCII, bubbles, texture, projected dust or embossing. Keep a static poster for reduced motion and skip frames offscreen. |
| Shared seam | Two aligned layers use the same geometry as the grip. Derive the clip and drawn curve from one set of points. | Before/after photo, material reveal, map layers, shader comparisons or a cutaway. |
| Shared bounds with a stable key | Measure or derive start and end bounds and interpolate the difference. Use a stable ID or transition name across views. | Card-to-drawer, expanding notifications, quick actions and recycling a selected tile into the detail heading. |
| One group owns the available space | Width gained by an active item is given up by siblings. Minimum values protect the inactive labels. | Photo accordion, options, property rows or a horizontal chapter menu. |
| Data moves in the correct unit | Derive chart heights, carries or tick positions from the actual value. Use a fixed origin and a fixed marker when comparing time. | Amounts, progress, shot sequence, track mode, time selection and dashboard filters. |
| Deform a nearby region | Store undeformed positions. Weight the grab by distance, constrain edges if their attachment matters, and blend back from the current state. | Paper, fabric, a swatch, a label or a media sheet. Start with CSS transforms for rigid bodies. Use a mesh when the deformation explains the material. |
| Reveal in chapters | A finite scroll range selects or blends adjacent scenes while the frame stays fixed. Expose the same chapters through controls on mobile and reduced motion. | Product assembly, a gallery tour, a changing evidence panel or an interactive type specimen. |
| Known progress and completion | Idle → active → success, error or cancellation. Show numeric progress from real work. For unknown duration show an indeterminate state and separately handle completion. | Progress buttons, copy acknowledgment, downloads and uploads. Keep the label, focus and retry control available. |

## Hold the design together

- Use the project's type, color and sizes. Match each incoming CSS custom property to its semantic job. A transform token belongs to the component. A foreground token normally comes from the host project.
- Use CSS transitions for finite state changes, spring motion when a hand can interrupt or reverse, and one animation frame loop for canvas or mesh work. Drive linked objects from the same progress value. Clamp elapsed time after a stalled or hidden tab.
- Beat out the interaction at rest, contact, approach, commit and settle. Enter and Space must reach the same destination as the pointer. For a range, test arrows and endpoints. Use an explicit cancel path where a gesture can leave its hit area.
- Tie state to content, and motion to state. A completed operation reports success once. A repeatedly pressed toggle resolves to the last state. Persist focus when a clicked item transforms into a detail view or regains focus after close.
- For a tactile data tool, compose the plot, controls and readouts as one instrument. Keep the scale and reference lines stable as data changes. Sample continuous gestures at rendering cadence and round the displayed reading independently. Record the opening state, held pause, reversal, and completion. Watch the recording at normal speed to judge jumps, pacing, and what the motion communicates before checking the timing report.
- Measure an actual recording or inspect CSS before claiming a source timing. Keep whether the evidence came from a live control, a recorded clip, or an inferred mechanism. For a new example, tune timing against the content and number of moving objects.
- Start a simple state change around 160–240ms and a deliberate spatial transition around 350–550ms. These are starting values for new work. Reduced motion keeps the information and lets the same controls reach the same states.

## Choose an animation API

For a sequence you can reverse or scrub, a physical control, or a layout transition with retained elements, check the [Anime.js guide](animejs.md). It maps the measured states and inputs to the right module and includes an offline workbench. Keep one owner for each animated property when adapting an existing component.

## Work from examples

[Field Signal](../blueprints/field-signal/index.html) combines a tactile dial, a continuous signal with a rounded numeric readout, a waveform morph, and a sweep with a held pause. Open the example in a browser or read [its source](../blueprints/field-signal/scope.js) for the input and drawing loop.

[The 12 Bencho blocks](../blueprints/bencho/README.md) contain implementation comments around the state, physics and geometry. [The original TARE blueprint](../blueprints/design-motion-studies.html) shows how the same concepts become a page-specific interaction. The materials study in [the motion preview](../blueprints/bencho/demo/preview.tsx) reapplies slot position to an assembled object. [Three standalone variants](../blueprints/transition-variants.html) demonstrate a card-to-dialog transition, a scroll-driven chapter selector and cancellable progress.

[Website motion studies](site-motion-studies.md) links visible behavior from the recordings to additional adaptations.

[Recording motion studies](recording-motion-studies.md) explains interval sampling, reversible timelines and how to carry one subject between known layouts.
