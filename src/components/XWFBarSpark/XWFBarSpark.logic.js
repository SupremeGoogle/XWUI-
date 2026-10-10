/** XWFBarSpark - logic. */
import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { XWF_BAR_SPARK_DEFINITION } from './XWFBarSpark.model.js';

export function createXWFBarSparkLogic(data = {}, conf = {}) {
  return new XWUIComponentLogic(XWF_BAR_SPARK_DEFINITION, data, conf);
}

/** Pure: bar heights as percentages of the largest bucket. */
export function deriveXWFBarSparkBars(buckets = [], minBarPercent = 6) {
  const max = Math.max(1, ...buckets.map((b) => b.value ?? 0));
  return buckets.map((b) => ({
    ...b,
    percent: Math.max(minBarPercent, Math.round(((b.value ?? 0) / max) * 100)),
  }));
}
