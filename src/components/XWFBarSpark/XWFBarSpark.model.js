/**
 * XWFBarSpark - model. A compact bar sparkline (the prototype's `.spark`): one bar per
 * bucket, tall as its share of the maximum; flagged buckets turn red, partial ones fade.
 */
/** @typedef {{ label?: string, value: number, flagged?: boolean, partial?: boolean }} XWFBarSparkBucket */

export const XWF_BAR_SPARK_DEFINITION = Object.freeze({
  id: 'XWFBarSpark',
  component: 'XWFBarSpark',
  properties: {
    data: {
      properties: {
        buckets: { type: 'array', default: [] },
        ariaLabel: { type: 'string', default: '' },
        uid: { type: 'string' },
      },
    },
    conf_comp: {
      properties: {
        height: { type: 'number', default: 70 },
        gap: { type: 'number', default: 4 },
        minBarPercent: { type: 'number', default: 6 },
        className: { type: 'string' },
      },
    },
  },
});
