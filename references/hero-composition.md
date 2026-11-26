# Compose the first screen

Choose the composition based on what the visitor needs to understand or do. Name the main subject, the space the headline and action need, and which supporting detail earns a place in the first viewport. Block those areas before choosing effects.

| Layout | Use it when | Keep this area clear |
| --- | --- | --- |
| Stepped frame | A short pitch and one action can carry the page, and the product or brand has a recognizable geometry | The center around the headline and action |
| Specimen with side rails | One object or product view explains the offer and needs a little context on either side | The object silhouette and the action rail |
| Product stage | The visitor is deciding whether to buy a particular item or variant | The product silhouette, plus a fixed group for the name, price and action |
| Cutout media | The value is easiest to show through footage or photos of the product in use | The copy area and the main subject or action in the footage |
| Signature shape | A distinct brand or product shape can orient a sparse hero | The readable interval between the shape and the headline |

## Stepped frame

Place the headline, one supporting line and the primary action in the center. Build the outer edges from a repeatable shape, such as a stepped product silhouette. Keep the outer shapes below or beside the copy so they draw the eye inwards. If a proof row matters, give it a stable baseline below the main group. On a phone, use a shallower edge crop or move the shapes below the action. Review the longest likely title and keep its lines inside the open area.

## Specimen with side rails

Let the main image span the full height of the desktop composition. Use a wider rail for the headline and a narrower rail for relevant details and a single action. A grid such as `minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, .7fr)` is one starting point. Set the semantic order around the decision, with the headline, specimen and next step before optional material. On a phone, stack those groups. Keep secondary media and proof subordinate to the specimen.

## Product stage

Use one dominant view of the item, a smaller material or detail view, and a tight purchase group with the name, selected variant, price and action. Keep the purchase group on a stable surface as the imagery changes. If a variant control changes the view, update the selected state, image and any price change together. On a phone, place the name, image and purchase group in a short sequence. Put optional detail media below that group.

## Cutout media

Use a large continuous image or video behind the composition. Give the headline and action their own solid area, and let the shaped edge cut the media around them. A smaller detail crop can explain a part or material. Keep the cut on a visual layer so the text and focus rings stay intact. Check that the cut leaves the key moment in the footage visible. On a phone, use a separate crop and a simpler edge, or stack the copy and media when the action needs more room.

## Signature shape

Choose a shape that belongs to the subject, such as an aperture, a housing or part of a wordmark. Use its arc or edge to frame a clear area for the headline and action. A crisp shape at rest is enough. When adding an entrance, keep the text and action visible while the shape settles around them. Check that the desktop arc or crop can be reduced independently of the mobile text.

## Before the build is done

Write down what the visitor sees first, which subject must survive the phone crop, and where the primary action sits in the reading order. Render the rest state on desktop and at 390 px and 320 px. Verify action labels, focus, media fallback and text contrast across relevant video frames. Use a responsive still for the main subject when video or scripting is unavailable, and check loading with the [web performance workflow](web-performance.md).

### Source observations

The supplied clip is credited on-screen to `@marcelodesignx`. It pairs layout sketches with visual examples. Approximate times below are offsets in the clip and describe the visible composition. The implementation choices above are adaptations.

| Sketch and example | What the pair shows |
| --- | --- |
| Around 3.1 s and 3.6 s | A centered message and action with stepped shapes entering from the lower sides. |
| Around 4.1 s and 4.6 s | A full-height center image flanked by headline and media on one side, with smaller supporting content on the other. |
| Around 5.1 s and 6.0 s | An isolated shoe in the center, a material detail at lower left, and the product name, price and order action grouped at lower right. |
| Around 6.6 s and 7.3 s | The Minipresso example leaves a clear upper-left copy area. The shaped footage area continues around it and meets a smaller product detail. |
| Around 8.2 s and 9.3 s | A large arc establishes the visual field behind a centered brand and message. |
