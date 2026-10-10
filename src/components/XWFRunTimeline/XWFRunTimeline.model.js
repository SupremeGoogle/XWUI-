/**
 * XWFRunTimeline - model. A waterfall of a run's attempts on one time axis (the prototype's
 * `.wf`): each attempt is a bar placed at its start offset, as wide as its duration.
 */
/**
 * @typedef {{ id: string, label: string, offsetMs: number|null, durationMs: number|null,
 *   tone: 'ok'|'err'|'pin'|'step'|'run'|'muted', note?: string, selected?: boolean }} XWFRunTimelineRow
 */
export const XWF_RUN_TIMELINE_TONES = Object.freeze(['ok', 'err', 'pin', 'step', 'run', 'muted']);

export const XWF_RUN_TIMELINE_DEFINITION = Object.freeze({
  id: 'XWFRunTimeline',
  component: 'XWFRunTimeline',
  properties: {
    data: {
      properties: {
        rows: { type: 'array', default: [] },
        totalMs: { type: 'number', default: 0 },
        startLabel: { type: 'string', default: '' },
        endLabel: { type: 'string', default: '' },
        uid: { type: 'string' },
      },
    },
    conf_comp: {
      properties: {
        labelWidth: { type: 'number', default: 170 },
        minBarPx: { type: 'number', default: 4 },
        selectable: { type: 'boolean', default: true },
        className: { type: 'string' },
      },
    },
  },
});

export const XWF_RUN_TIMELINE_EVENTS = Object.freeze({ SELECT: 'xwf-select' });
