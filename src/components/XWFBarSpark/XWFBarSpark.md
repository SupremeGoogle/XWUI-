# XWFBarSpark

Bar sparkline. `XWUIDisplaySparkline` (basic) draws a line only; bar charts live in the
licensed chart tier.

| data | type |
|---|---|
| `buckets` | `{ label?, value, flagged?, partial? }[]` |
| `ariaLabel` | string |

| conf_comp | default |
|---|---|
| `height` | `70` |
| `gap` | `4` |
| `minBarPercent` | `6` |

```js
new XWFBarSpark(el, { buckets: [{ value: 4 }, { value: 9, flagged: true }], ariaLabel: 'Runs per hour' });
```
