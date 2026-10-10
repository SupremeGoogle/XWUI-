/** XWFRunTimeline - logic. */
import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { XWF_RUN_TIMELINE_DEFINITION } from './XWFRunTimeline.model.js';

/** Percent of the axis a caption needs to sit after its bar. */
const CAPTION_ROOM = 15;

export function createXWFRunTimelineLogic(data = {}, conf = {}) {
  return new XWUIComponentLogic(XWF_RUN_TIMELINE_DEFINITION, data, conf);
}

/**
 * Pure: bar geometry in percent of the axis, and where its caption sits (after the bar
 * when there is room, before it otherwise).
 */
export function layoutXWFRunTimeline(rows = [], totalMs = 0) {
  const total = Math.max(1, totalMs || Math.max(0, ...rows.map((r) => (r.offsetMs ?? 0) + (r.durationMs ?? 0))));
  return rows.map((row) => {
    if (row.offsetMs === null || row.offsetMs === undefined) return { ...row, hasBar: false, captionLeft: 2 };
    const left = Math.min(100, (row.offsetMs / total) * 100);
    const width = Math.max(0, Math.min(100 - left, ((row.durationMs ?? 0) / total) * 100));
    const end = left + width;
    const captionLeft = end + CAPTION_ROOM <= 100 ? end + 2 : Math.max(2, left - CAPTION_ROOM - 9);
    return { ...row, hasBar: true, left, width, captionLeft };
  });
}
