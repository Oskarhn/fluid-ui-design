# Product walkthrough

Build the story around one actual task with a visible result. Use a representative slice of the product; the crucial object should remain identifiable in every state.

- **Composition** — on desktop, 4/8 split between a short task list and a stable stage. Set a 1.5–1.8 stage aspect ratio and align its top edge with the section heading. On a narrow screen place the controls directly above the stage. Keep the selected step visible while its content is read.
- **Look** — distinguish page ground, device surface and active row by tonal steps. Use one accent on the active control and the state change. Start with a 40–64px section heading, 16px instructions, and 13–15px stage UI.
- **Sequence** — choose 2–4 real task steps. Swap the changed portion with a 160–220ms transition. Preserve the frame, task name, scale and scroll position. If using scroll to drive the demo on wide layouts, provide discrete controls and a normal-flow version.
- **Fallback** — use approved screenshots or build a small representative interface with realistic task data. A no-motion mode shows every result on demand. Mark mock data where a viewer could mistake it for real activity.
- **Check** — all states have a useful caption and respond to mouse, touch, and keyboard. Verify forward, reverse and repeated selection.

Study input: the supplied multi-channel brief uses a common frame to show different views of a task. The technique is independent of the messaging products in the original.

## Alternate the media, retain the reading order

In the supplied Hero Inspo recording, the website viewport sits inside a vertical video. The surrounding backdrop, header overlay and watermark belong to the recording. Within the website view, a handset introduces the product, then tall in-use media alternate with short copy.

On the split-screen sequence at about 14.53 s, a narrow strip of incoming media appears near the center while the outgoing media is still visible. By about 14.87 s the incoming media holds the left side. The corresponding right-side headline finishes appearing around 15.3 s. These are observed frame times in the edited 30 fps clip.

- Keep two explicit media states and reserve a common crop. Close the outgoing visual toward the seam and open the incoming one from the seam. Start with both resting layouts readable before adding movement.
- Preserve the sequence of heading, explanation and action in the document. Use layout to alternate positions on wide screens. On a phone, use one image slot and put the corresponding explanation below it.
- Keep optional accent changes at the scene level. Let the product sample carry the proof. Keep the section visible and make the media transition the only moving layer in the adapted pattern.
- Use one progress value so a new selection can reverse from the pose currently on screen. Keep the controls in place, selectable by tap and keyboard. Apply the new state directly when reduced motion is enabled.

[Working adaptation](../../../blueprints/alternating-media-study.html) with two illustrated scenes.
