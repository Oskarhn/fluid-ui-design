# Study a site or control, then adapt its behavior

Pick the part that matters to the brief. Record the media, layout anchors, reading order, and the action that changes the state. For animation, capture what happens before input, while the change is visible, on release, and after a reversal or cancellation. A CSS transition's declared duration is evidence about the browser state, and a still image is evidence about composition.

## Landing pages and whole destinations

These are observations from the supplied URLs on 26 November 2026. Browser captures used public routes in isolated Chrome sessions. HTML-only observations support the content roles and visible structure listed below. They provide no interaction timing.

| Reference | Observed | Adapt it |
| --- | --- | --- |
| [Zero](https://zero.inc/) | Published page HTML places a choice of four sales stages above an illustrative product workspace. | Make each stage update the action and the product view together. Keep the stage controls in the same place. Verify the swap and the selected state on the live reference before matching the motion. |
| [Meeko](https://meeko-template.framer.website/) | Chrome showed a portfolio opening with the designer's introduction, followed by project media and an about section. | Lead with an identifiable person or studio, then show a project image that earns the first click. On a phone, alternate the crop and caption in reading order. For template reuse, use the publisher's license. |
| [Munch](https://munch-nextjs-template.vercel.app/) | Chrome showed people and food before the menu and preparation steps. The sampled interaction and scroll emitted opacity and translation transitions. | Brief the photography in three roles: people in the setting, the product, and a step that proves how it is made. Keep the order action persistent when the visitor opens a menu. |
| [Wahoo Pricing](https://wahooservices.co.uk/pricing) | Public HTML puts the scope of the service above founder questions. | Group the deliverable, who it suits, and the next action before FAQs. Keep cost and scope readable without scrolling through animated testimonials. |
| [ChainGPT Labs Portfolio](https://labs.chaingpt.org/portfolio) | Public HTML exposes category controls and a search field before the case list. | Model category, query, and empty state separately. Use the same project fields when results are filtered. |
| [Deadwater](https://www.deadwater.fr/en/) | Chrome showed a media-led studio list with video elements and named projects. | Match a preview to the project currently in focus. Keep titles available before video loads, and pause media offscreen or when a project closes. |
| [GitHub Universe](https://githubuniverse.com/) | Chrome showed a post-event edition with highlights and continuation links. | Event pages need a post-event state. Change the primary action to highlights or talks while keeping shared navigation stable. |
| [SBXi](https://www.sbxi.com/) | Published HTML groups founder portraits, portfolio proof, and different application steps for funding paths. | Pair portraits with clear attribution. Toggle the steps according to the selected path, and make each sequence understandable by itself. |
| [Wahoo Services](https://wahooservices.co.uk/) | Chrome showed a short service proposition followed by concrete client stories and named proof. | Lead with the outcome, then link to one story with a verifiable result. Use scoped evidence instead of generic claims. |
| [ChainGPT Labs](https://labs.chaingpt.org/) | Published HTML groups ecosystem references, partner media, and separate programs. | Organize complex offerings by audience or task. Preserve the destination when a visitor moves from a description to a program. |
| [General Intelligence Company](https://www.generalintelligencecompany.com/) | Published HTML uses text, diagrams, and figure labels to make the argument in sequence. | Let a diagram explain one relationship. Keep the adjacent text sufficient to understand it when the diagram is unavailable. |
| [Schematik](https://www.schematik.io/) | Chrome showed templates near the top, then real project examples. Some sampled scroll transitions declared 700 ms transform and opacity. | Let the first product screen show what someone can start with, then show what a finished result looks like. Keep instructions and the core action readable before motion. |
| [Heron](https://heronaiapp.com/) | The requested route returned HTTP 403 in both viewing attempts. | Use an authorized capture or a supplied recording for composition and interaction evidence. |

Keep original photos with a clear crop, working proof, and one reason to be visible. If a project lacks suitable assets, brief original images around the subject, activity, and lighting the page needs. Give a video a still poster and a stable aspect ratio. Verify the main action while media is off. For a source image or template, use the terms from its publisher.

## Component studies

[Crafts](https://heyaviral.com/craft) exposed the eleven requested demo routes in its public catalogue. The corresponding [interaction-controls example](../blueprints/interaction-controls/index.html) has original implementations and its own visual design. Adapt the caption, type, placement, colors, and data to the receiving project. Use the publisher's code when its license covers the intended reuse.

| Pattern | State and behavior to preserve |
| --- | --- |
| [Switch tabs](https://heyaviral.com/craft/switch-tabs) and [Wobble tabs](https://heyaviral.com/craft/wobble-tabs) | Selection, focus and panel change together. Give a shared indicator its own movement. Support arrow keys and keep the panel readable while the indicator settles. |
| [Password rules](https://heyaviral.com/craft/password-rules) and [OTP input](https://heyaviral.com/craft/otp-input) | Keep one native input for each logical value. Make the rules readable, let paste and autofill work, and provide clear feedback without requiring motion. |
| [Duration picker](https://heyaviral.com/craft/duration-picker) | Keep one numeric value behind the readable duration. Clamp supported limits and let people step or type a value. |
| [Wave loader](https://heyaviral.com/craft/wave-loader) and [Process button](https://heyaviral.com/craft/process-button) | Show an indeterminate state when progress is unknown. Use actual progress when it exists. Support cancellation and completion with a readable status. |
| [Record waveform](https://heyaviral.com/craft/record-waveform) | Tie the displayed wave and elapsed time to one recording state. Stop the frame loop on release or stop. In the local example the audio input is simulated. |
| [Copy tabs](https://heyaviral.com/craft/copy-tabs) and [Segmented nav](https://heyaviral.com/craft/segmented-nav) | Copy the currently visible command. Show the selected range as text and keep selection independent from a visual spring. |
| [Draggable list](https://heyaviral.com/craft/draggable-list) | Handle, proposed destination, and final order are distinct. Preserve a keyboard and tap path and keep focus on the moved item. |
| [ResolveOS sign-in](https://resolveos-phi.vercel.app/signin) | Chrome exposed a decorative canvas and mechanical-looking CSS animations. Keep visual material behind a stable sign-in form. Keep the same semantics without the canvas. |
| [Motion Minimal Navs](https://www.framer.com/marketplace/components/motion-minimal-navs/) | The marketplace describes a compact control expanding to a menu, with rolling hover labels. Adapt the open and close states with dependable touch, Escape, and visible focus. The original has a limited marketplace license. |
| [design.moment](https://design.moment.com/) | Chrome exposed a canvas and a photographic presentation. A useful adaptation is to keep the art-directed sample stable while the visitor changes focus, with a photographic or static fallback. |

### X references

Direct Chrome navigation did not provide a reliable media view. The official public embed response recovered the descriptions for all fifteen posts. Treat these notes as leads until the footage can confirm exact behavior.

| Reference | Study target from the public description |
| --- | --- |
| [Iconists](https://x.com/iconists/status/2125150712216863014) | A menu icon as an open or closed state cue. |
| [Sonia Axion](https://x.com/sonia_axion/status/2123584148648399175) | Expose frequent actions together and reduce visual competition while choosing. |
| [Umit Celik](https://x.com/umitceliks/status/2120476578622669278) | A funnel with a legible stage sequence. |
| [Anuar](https://x.com/Anuar_DesignX/status/2120143554244686288) | A calorie display study. Keep units visible and use only actual or clearly labeled sample measurements. |
| [Justyna](https://x.com/justynabuilds/status/2114725547209314359) | A portfolio drawer. Verify which part of the previous view persists. |
| [Jessy Barret](https://x.com/barret_jessy/status/2114756442804949307) | A completion cue for checking something off. |
| [Matthias Oel](https://x.com/Matthias_Oel/status/2108211031432695852) | The expanding Framer nav described above. |
| [Raul Dronca](https://x.com/raul_dronca/status/2103409890781720977) | Tool folders. Study the path from group to tool and back. |
| [Aditya Sur](https://x.com/AdityaSur11/status/2101529283810210252) | A stacking sequence. Check the contact point and the order in which pieces arrive. |
| [Kaolti](https://x.com/kaolti/status/2101335516360647104) | Interactive cards. Check the pointer and keyboard states. |
| [Pranav](https://x.com/ThatsPranav/status/2098736380008448180) | A copy action with a visible completion state. |
| [Tiago Costa](https://x.com/tcosta/status/2097385373584203921) | A short reference titled with a disappearance cue. The description alone does not establish the technique. |
| [UIUXJoy](https://x.com/uiuxjoy99/status/2096819458719498548) | A lightweight editing workflow. Identify the edit that matters and its undo or cancel path. |
| [Jakub Krehel](https://x.com/jakubkrehel/status/2038645821537722726) | An onboarding step indicator. Show what is complete and which action advances the user. |
| [abjt14](https://x.com/abjt14/status/1930670665926914450) | A shimmer and bounce reference. Verify the trigger and the resting state before choosing timing. |

## Adapt the supplied motion prompts

- **Video backdrop.** Design a still first with deliberate type contrast and a stable action region. Add an owned loop or frame sequence at the appropriate size. Preserve playback and pause control and keep text outside the video asset.
- **Pointer reveal.** Layer two project-owned views with shared local coordinates. Stamp a path on a bounded mask and let it decay after movement stops. Use the difference across the mask boundary to draw an edge. Keep a visible way to select the same details by keyboard or touch.
- **Glass panel and return.** Separate the semantic page from the visual 3D layer. Keep stable identities for text-bearing pieces so they can leave and come back from known anchors. Give the destination and Back action a working HTML path before adding tilt, depth, or a material effect.

Use [recording motion studies](recording-motion-studies.md) to compare the observed states. For runnable code, choose a compatible [licensed component pack](../vendor/interaction-packs/README.md) or adapt the local control example, then test the interaction with the receiving layout and content.
