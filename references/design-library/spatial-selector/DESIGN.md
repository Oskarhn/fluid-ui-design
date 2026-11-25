# Spatial selector

Use when the visitor can compare three to five meaningful variants. The selected item must remain fully readable, with another angle or option visible as a cue.

- **Composition** — center one active panel and fit inactive panels into the periphery. Keep labels and selector buttons in stable, separate rows. For narrow viewports, use a single panel and a segmented selector, or a native snap rail.
- **Look** — give all variants the same type hierarchy and frame dimensions. Use accent colors to identify actual alternatives. Start at a 24–32px panel radius and reserve sufficient height for the longest title.
- **Motion** — size and angle the side panels with CSS transforms. Aim for 320–480ms with a decelerating curve. A new selection immediately takes over the current transition. Animate shadow sparingly and avoid autoplay when every panel carries information.
- **Fallback** — keep buttons with a visible active state and a unique label per variant. Reduced motion instantly selects the next panel. On touch, buttons remain available if drag is implemented.
- **Check** — the foreground text is interactive and readable during a rapid reversal. Hidden panels cannot receive focus; prevent clipping at the layout breakpoints.

Study input: supplied metric-card carousel. Its rotating video cards suggested showing depth around a controlled selection. [GetDesign preview catalog](https://getdesign.ai/).
