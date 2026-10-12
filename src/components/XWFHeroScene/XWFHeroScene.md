# XWFHeroScene

A Neon Depth hero scene visual. Extends `XWUIComponent`; uses the same constructor, state methods and cleanup contract as basic components.

- `data`: `scene`, `zoom`, `busy`. Content comes from a page API; no fetching occurs here.
- `conf_comp`: `className` (optional).
- Methods inherited from XWUI: `setData`, `updateData`, `updateConfig`, `destroy`.
- Event: `xwf-action`, bubbles with a structured `detail` describing the activated action (interactive components only).
- Custom element: `<xwf-hero-scene>`.
- Model owns defaults/constants, logic owns derived state, view owns projection, CSS owns token-based styling.
- The reference ring, wires and nodes share one plane. `ResizeObserver` recalculates
  its scale and scene height from the actual container width, including intermediate
  sizes. The observer disconnects on destroy. Reduced motion disables decorative animation.

```js
new XWFHeroScene(container, data, {});
```
