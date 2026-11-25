# From recording to an interaction

Use a recording for visible timing, staging and input. Use a still for crop, type, colors and component shape. Keep the captured site and its prompts as study material. Create the runnable example with the receiving project's own content and media.

## Read the recording

1. Inventory the clips, dimensions, duration and frame rate. Sample the whole recording for context. Choose the part where a visible action or state change happens. Note whether the recording includes the trigger.
2. Extract consecutive frames for that interval. In constant-rate footage at 60 fps, one frame is about 16.7 ms. For variable-rate footage, use frame timestamps. Label the first visible change, midpoint, persistent elements and the first visibly settled state. Distinguish an approximate observation from an exact property value.
3. Identify what stays stable. An object can bridge two layouts, the same viewport can host two color planes, or a detail can change without moving its surrounding frame. Build a rest state first and use its geometry to anchor the movement.
4. Choose a clean implementation. Use one normalized progress value for related layers. Test the forward path, reversal, interruption, keyboard, touch and reduced motion. Start with the settled composition if media or scripting fails.

## Observations from the 24 November recordings

The sources were screen recordings of MotionSites previews. Times below refer to the artifact clips, and visual thresholds are approximate. Sample filenames use Europe/Oslo local time.

| Captured behavior | Approximate evidence | Transfer to a new design |
| --- | --- | --- |
| A new product variant enters at the right edge. The center clears quickly, then the boundary takes longer to reach the far edge. | Smoothie Slider, 13-26-52. In frames 35–44 (0.58–0.73 s), the new pink panel goes from roughly one quarter to around nine tenths of the visible stage. The new material is almost fully visible by about 0.97 s. | Put the next color plane beneath the outgoing plane. Clip the upper plane using one progress curve. Give type, product and detail separate travel distances. Preserve controls above both planes. |
| The chosen object stays visible as the surrounding shelf recedes and the inspector opens. | Record Shelf, 13-29-17. Neighboring covers start receding near 4.13 s, the split becomes readable around 4.33–4.43 s, and the detail heading arrives after the split. | Keep one identity for the selected object. Move its bounds between anchors. Bring metadata in after there is enough space to read it. Return focus to the triggering control. |
| A near foreground grows through the frame before the scene reaches its detail composition. | Moss Island, 13-56-21. The rush toward the foreground is visible around 3.50–3.85 s. The station is distinct near 3.9 s and the terrain largely settles by about 4.3 s. | Start with an overview, use depth and scale to direct attention, then land on a functional detail. Preserve copy in a readable layer. A fixed detail button and a still are useful on mobile. |
| The set persists while content changes. | Forge Gate, 13-28-18. Sampled at 0.2 s intervals, the front view gives way to an angled view while the lit doorway stays identifiable. | Match camera composition and a shared landmark before changing text. Scrub only where reversing the change adds value. |
| A product maintains visual continuity across several page sections. | Protein Bars, 13-28-58. The recording shows variant selection, a rotated product detail and the product family at the purchase section. | Use one specimen model with overview, inspection and destination anchors. Read current bounds after resize. Keep the normal document layout available when the visual enhancement is unavailable. |
| The effect changes locally around a stationary subject. | Halo Prism, 14-03-14. the visible beam changes direction and spread while the prism and text stay steady. Its physical rendering method is unconfirmed. | Keep the visual anchor fixed, map one input to beam direction, and derive the palette or light output from that parameter. Keep a narrow affected area. |

## Apply the prompt and tutorial approach

The supplied briefs span product variants, cinematic travel, a camera chapter transition, a traveling product, a shelf-to-detail view, a terrain fly-in and a particle field. Their strongest reusable technique is to describe anchors, paint order, timing and small-screen outcomes explicitly. Make a compact state table before writing a renderer.

- Build the semantic interface and still composition first. Add motion as an enhancement to the same task.
- Choose video for fixed ambient footage. A frame sequence can support precise bidirectional scrubbing. Use a bounded cache, decode only neighboring frames, and keep a poster and static content as fallbacks. Use a live scene when input genuinely changes the camera, geometry or light.
- Define what the pointer or scroll actually drives. Avoid relying on hover for core mobile actions. Respect a user's interruption and keep the resting states usable with reduced motion.
- Write checks for the exact interaction. Include an interrupted transition and a portrait viewport. Avoid inheriting the source's decoration, fictitious proof, or global scroll effects. See [design defaults](design-defaults.md).

[Runnable adaptations](../blueprints/recording-motion-studies.html) implement a reversible layered wipe and a specimen that travels through three anchors. Their timing and artwork are original design choices.
