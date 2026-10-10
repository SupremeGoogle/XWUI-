# XWFPricingTiers

A Neon Depth pricing tiers visual. Extends `XWUIComponent`; uses the same constructor, state methods and cleanup contract as basic components.

- `data`: `tiers`. Content comes from a page API; no fetching occurs here.
- `conf_comp`: `className` (optional).
- Methods inherited from XWUI: `setData`, `updateData`, `updateConfig`, `destroy`.
- Event: `xwf-action`, bubbles with a structured `detail` describing the activated action (interactive components only).
- Custom element: `<xwf-pricing-tiers>`.
- Model owns defaults/constants, logic owns derived state, view owns projection, CSS owns token-based styling.

```js
new XWFPricingTiers(container, data, {});
```
