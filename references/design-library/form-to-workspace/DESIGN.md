# Form to workspace

Use for a real form where the next screen gives the user something immediately valuable. A demo should use local state and disclose it. A production handoff depends on the actual submit response.

- **Composition** — on a medium or large screen keep the task block near 400–480px wide and place any secondary image in an adjacent plane. The destination opens with a meaningful heading or first task. On phone widths use normal document flow.
- **Look** — carry one stable identifier, such as the mark or the workspace name, across the state change. Field labels stay visible. Give focus, validation and progress distinct, legible appearances.
- **Motion** — schedule the transition only after success. Keep the shared region visually stable and fade the outgoing/incoming content over 160–240ms. Move focus to the new heading. Preserve values through validation errors.
- **Fallback** — use a normal navigation and focus pattern when motion is reduced or View Transitions are unavailable. Failed or pending submissions keep the user in a recoverable form state.
- **Check** — exercise slow response, failure, repeated submission, keyboard use and a direct link to the destination. A decorative loading scene should never be needed to understand application state.

Study input: supplied two-scene form and dashboard brief. The reusable element is continuity between views. Original runnable view swap in [Motion studies](../../../blueprints/design-motion-studies.html).
