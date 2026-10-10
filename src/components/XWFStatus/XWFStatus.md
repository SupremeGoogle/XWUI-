# XWFStatus

Shaped status marker plus label (the prototype's `.st`). XWUI basic ships no equivalent:
`XWUIDisplayStatus` is an abstract base that renders nothing on its own.

| data | type |
|---|---|
| `label` | string |

| conf_comp | values | default |
|---|---|---|
| `kind` | `ok` `err` `warn` `run` `idle` `pin` `dis` | `idle` |
| `size` | `sm` `md` `lg` | `md` |

```js
new XWFStatus(el, { label: 'Published' }, { kind: 'ok' });
status.setStatus('Failed, 503', 'err');
```

Screen readers hear the kind word before the label. The spinner stops under `prefers-reduced-motion`.
