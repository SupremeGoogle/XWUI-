# XWFTemplate

Reference xwflow component. It shows the anatomy every `XWF*` component follows; copy the
folder when a screen needs something XWUI basic does not ship.

| File | Role |
|---|---|
| `XWFTemplate.model.js` | Definition (`data` / `conf_comp` buckets with defaults), enums, event names |
| `XWFTemplate.logic.js` | `createXWFTemplateLogic()` → `XWUIComponentLogic`; pure derived-state helpers |
| `XWFTemplate.view.js` | `projectXWFTemplateView(state, handlers, ui)` → DOM, XWUI children via the ui kit |
| `XWFTemplate.js` | `class XWFTemplate extends XWUIComponent`, public API, events, `destroy()`, custom element |
| `XWFTemplate.css` | Styles on `--xw-*` tokens and XWUI variables only |

## data

| Key | Type | Default |
|---|---|---|
| `title` | string | `''` |
| `items` | `{ id, label, hint?, tone? }[]` | `[]` |
| `selectedId` | string | `''` |

## conf_comp

| Key | Type | Default |
|---|---|---|
| `variant` | `'glass' \| 'plain'` | `'glass'` |
| `selectable` | boolean | `true` |
| `className` | string | |

## Events

`xwf-select` (bubbles) → `detail: { id, item }`.

## Usage

```js
import { XWFTemplate } from './XWFTemplate.js';
const list = new XWFTemplate(el, { title: 'Triggers', items }, { variant: 'glass' });
el.addEventListener('xwf-select', (e) => console.log(e.detail.item));
list.select('webhook');
```

```html
<xwf-template></xwf-template>
```
