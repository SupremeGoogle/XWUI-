# Architecture contract

Shared rules for everyone working on this repo. The kernel (`index.html`, `src/app.js`,
`src/core/*`, `src/styles/*`, `src/components/_template/*`, `src/api/index.js`) is owned by
the core maintainer; zones own their folders.

## Runtime

- No build step. ES modules, served by any static server.
- XWUI basic from the CDN through the import map in `index.html`:
  `import { XWUIButton } from '@exonware/xwui/basic'`.
- XWUI injects each component's stylesheet from the CDN at runtime.
- `?mock=fast` disables simulated latency, `?mock=flaky` multiplies failure rates.

## Zones, pages, layouts

```
src/zones/<zone>/index.js  -> export default { id, layouts: { <layoutId>: LayoutClass }, pages: [pageModule...] }
```

Page module:

```js
export default {
  id: 'pricing', path: '/pricing', layout: 'website', title: 'Pricing',
  async mount(el, ctx) { /* ... */ return { unmount() {} }; },
};
```

`ctx`: `{ api, bus, notify, navigate, href, route, params, query, layout, setTitle, appName }`.

Layout class: `new Layout(root, ctx)`, `.outlet`, `.setActive(route)`, `.destroy()`.
The router reuses the layout while consecutive pages share its id.

In-page anchors: link to `#/path?section=<elementId>`; the router scrolls to it after mount.
Build links with `ctx.href('/studio/runs/:runId', { runId })`.

## Mounting XWUI (src/core/ui.js)

```js
const { scope, ui } = createKit();          // inside a component: createKit(this)
el.append(h('div', {}, ui.button('Save', { variant: 'primary', icon: 'check', onClick })));
scope.mount(XWUITable, host, data, conf);    // any XWUI component, tracked for destroy
scope.listen(window, 'resize', onResize);    // listeners removed on destroy
return { unmount: () => scope.destroy() };
```

`ui.button / icon / tag / spinner / skeleton / empty / alert / dialog / mount(Component, data, conf)`.

- Button variants: `primary` (lime), `secondary` (glass), `outline` (gradient border), `ghost`, `danger`.
  Sizes: `sm`, `md`, `lg`.
- Tag variants: `default | primary | success | warning | error`; extra prototype tones through
  `conf_comp.className`: `xw-tone-cyan | xw-tone-violet | xw-tone-pink | xw-tone-orange | xw-tone-plan`.
- Icons: lucide/tabler-style names (`play`, `settings`, `webhook`, `git-branch`, `database`,
  `sparkles`, `key`, `shield`, `zap`, `clock`, `bot`...). Material ligatures are not loaded.
- `ui.dialog({ title, content, actions: [{ id, label, variant }] })` resolves with the action id or null.

Reading XWUI APIs: schema `https://xwui.dev/schemas/v1/components/<Name>.schema.json`, docs
`https://xwui.dev/styles/components/basic/<Name>/<Name>.md`, runnable examples
`https://xwui.dev/styles/components/basic/<Name>/examples/<Example>.ts`.

## Dummy API

`src/core/mock.js`: `respond`, `delay`, `clone`, `paginate`, `matches`, `sortBy`, `newId`, `nowIso`,
`createCollection`, `createDocument`, `ApiError`. Each domain module `src/api/<domain>.api.js`
exports `<domain>Api` and reads only its own `src/data/<domain>.data.js`. Pages and components
never import `src/data/*`.

## Custom components

Copy `src/components/_template/`: `Name.model.js`, `Name.logic.js`, `Name.view.js`, `Name.js`
(`extends XWUIComponent`, registered with `createXWUIElement`), `Name.css`, `Name.md`.
Prefix `XWF`, tag `xwf-<kebab>`. Link the stylesheet before `super()` (see the template).

## Styling

- Tokens: `--xw-*` in `src/styles/theme.css` (also mapped onto XWUI variables).
- Primitives ported from the prototype: `src/styles/base.css` (`.glass`, `.stack`, `.rowf`,
  `.gap*`, `.g2/.g3/.g4`, `.h1..h4`, `.eyebrow`, `.kpi`, `.st.*`, `.nd`, `.cv`...).
- XWUI tuning: `src/styles/xwui-overrides.css`.
- Page-specific styles next to the page (`<page>.css`), loaded with `ensureStylesheet`.

## Canonical sample ids

Flows: `flow_order_alert`, `flow_weekly_digest`, `flow_sync_customers`, `flow_refund_approval`, `flow_lead_intake`.
Runs: `run_order_alert_001` (succeeded), `run_weekly_digest_014` (failed), `run_lead_intake_007` (failed),
`run_order_alert_009` (failed), `run_sync_customers_003` (running).
