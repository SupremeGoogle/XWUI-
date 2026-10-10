# XWFRunTimeline

Waterfall of a run's attempts on a shared time axis. `XWUITimeline` (basic) lists dated
events vertically and has no duration axis.

| data | type |
|---|---|
| `rows` | `{ id, label, offsetMs, durationMs, tone, note?, selected? }[]`; `offsetMs: null` draws no bar, caption only |
| `totalMs` | axis length (defaults to the last bar's end) |
| `startLabel`, `endLabel` | axis captions |

| conf_comp | default |
|---|---|
| `labelWidth` | `170` |
| `minBarPx` | `4` |
| `selectable` | `true` |

Tones: `ok`, `err`, `pin`, `step`, `run`, `muted`. Event `xwf-select` (bubbles) → `detail: { id }`.

```js
const tl = new XWFRunTimeline(el, { rows, totalMs: 1067, startLabel: '0 ms', endLabel: '1,067 ms' });
el.addEventListener('xwf-select', (e) => openAttempt(e.detail.id));
```
