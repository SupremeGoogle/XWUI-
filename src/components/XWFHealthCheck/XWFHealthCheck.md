# XWFHealthCheck

A Neon Depth health check visual. Extends `XWUIComponent`; uses the same constructor, state methods and cleanup contract as basic components.

- `data`: `check`, `busy`. Content comes from a page API; no fetching occurs here.
- `conf_comp`: `className` (optional).
- Methods inherited from XWUI: `setData`, `updateData`, `updateConfig`, `destroy`.
- Event: `xwf-action`, bubbles with a structured `detail` describing the activated action (interactive components only).
- Custom element: `<xwf-health-check>`.
- Model owns defaults/constants, logic owns derived state, view owns projection, CSS owns token-based styling.

```js
new XWFHealthCheck(container, data, {});
```
