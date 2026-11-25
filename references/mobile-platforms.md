# Mobile interfaces

Choose the platform first. Reuse the interaction intent across platforms. Use that platform's input, navigation and accessibility primitives.

| Surface | References and starting point | Verify |
| --- | --- | --- |
| Mobile web or PWA | Existing HTML/CSS stack, native controls, Apple Design for direct manipulation, and [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) | Narrow and short viewports, safe areas, touch, keyboard, visible focus, larger text and reduced motion |
| iPhone or iPad with SwiftUI | [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) and [SwiftUI Pro 2.0 by Paul Hudson](https://github.com/twostraws/SwiftUI-Agent-Skill/tree/f2920b63995263f57b3e198674e89a602efba6d2/swiftui-pro) | Compact and expanded layouts, Dynamic Type, VoiceOver, Reduce Motion, appearance and the project's minimum OS |
| Other mobile app | Platform controls and navigation plus Apple Design's gesture and motion principles where they fit | Gesture, screen reader, large text and back navigation on supported devices |

Use the installed Apple Design, SwiftUI Pro and Web Design Guidelines skills where available. This guide summarizes their relevant principles and works on its own. On SwiftUI work, consult SwiftUI Pro's design, accessibility, resizability and views sections for deeper checks. Verify the receiving project's deployment target and SDK before adding a version-specific API.

## Choose a mobile composition by task

| Task | Start with | On a narrow or short screen |
| --- | --- | --- |
| Marketing site, portfolio or product story | [First-build workflow](design-reference-workflow.md) and [design studies](design-library/INDEX.md) | Give the heading, proof and primary action a clear reading order. Choose a phone crop with its own focal point. Adapt optional motion to supported input. |
| Dashboard, settings or operational tool | [App screens](app-screens.md), especially its phone section | Fold wide navigation into a reachable route, keep filters and status available, and preserve the selection and scroll position on return from detail. Use an accessible list or a contained table for comparisons. |
| Gesture-led controls such as dials, sliders and drawers | [Mobile motion](motion-mobile-and-ux-patterns.md), [Apple Fluid Interfaces](apple-fluid-interfaces.md), and the platform's familiar control semantics | Keep the value and a tap path visible before and after the gesture. Give overlapping targets space and isolate any custom drag from page scroll. |
| Explanation that depends on an app frame or video | [Product walkthrough](design-library/product-walkthrough/DESIGN.md) or [Stageshow](../stageshow/SKILL.md) | Keep the action or evidence legible in the crop. Use discrete controls for important demo states, plus a still or short description. |

For a compact web workspace, make the main task visible early and test it with the on-screen keyboard showing. Keep essential controls reachable on touch and keyboard. If space is tight, move supporting detail into an explicit expandable view and preserve its navigation state. On native and cross-platform apps, use the receiving platform's navigation, controls, text scaling and accessibility conventions.

## Mobile web

- Put the action beside the content or value it affects. Stack in task order on narrow screens. Reserve room for sticky chrome so it cannot cover keyboard focus, form errors or content.
- Set the viewport, allow pinch zoom and use relative text sizing. Use safe-area insets where UI reaches the screen edges. Use svh for a stable viewport section and dvh for a surface that must follow moving browser chrome. Test the on-screen keyboard where there is text entry.
- Use 44 × 44 CSS px as a practical target for primary controls. WCAG 2.2 AA requires 24 × 24 CSS px or an applicable exception. Apple recommends a 44 × 44 pt default on iOS and iPadOS. [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). [Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Give drag a simple tap alternative, such as a clickable slider track, stepper or menu, plus keyboard access. Keep the native button or input behind the custom material and scope touch-action to the surface that needs it. [W3C dragging guidance](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).
- Test at 320px, about 390px, a short landscape viewport and enlarged text. Use touch and keyboard, check native scroll and focus, reduce motion and test a failed background or media state.

## SwiftUI

- Use native Button, Slider, Stepper, Picker, NavigationStack, NavigationSplitView and sheets where the deployment target and existing flow support them. For a small ordered set consider a system wheel picker. For a bounded number use a native adjustable control.
- Use a binding for the authoritative value and local private state for local interaction. Keep navigation and selection above compact/expanded layout branches. Use available space and ViewThatFits where content could unexpectedly wrap.
- Start with system text styles and semantic colors. Use ScaledMetric for custom dimensions that follow Dynamic Type. Keep text flexible and give VoiceOver controls a name, value, and action. Hide purely decorative drawings. A custom adjustable control should implement increment and decrement via [accessibilityAdjustableAction](https://developer.apple.com/documentation/swiftui/view/accessibilityadjustableaction(_:)).
- Use accessibilityReduceMotion and retain a discernible selected state without relying on color. Add haptics for meaningful detents when the device and OS support them. Check keyboard and VoiceOver, plus large Dynamic Type, in Simulator or on device before making a native verification claim.

## Motion and affordance

Show press feedback as contact begins and commit based on the platform control's activation rules. For a direct drag, preserve the grab point and let a new contact interrupt release motion. Normalize circular angle deltas through ±180°, clamp bounded values, and give detents meaningful units. Keep a number or marker readable at rest, during input and after release. Under reduced motion, remove large travel and overshoot while preserving the same outcome. Treat shadows and material as visual cues, with visible focus and a stable label.

[Web control study](../blueprints/mobile/control-styles.html) · [SwiftUI level control](../blueprints/mobile/InstrumentLevelControl.swift) · [Apple motion HIG](https://developer.apple.com/design/human-interface-guidelines/motion)

[Design skill coverage](design-skill-coverage.md) lists the integrated sources and optional specialist lookups.
