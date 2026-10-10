/** XWFStatus - logic. */
import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { XWF_STATUS_DEFINITION, XWF_STATUS_KINDS } from './XWFStatus.model.js';

export function createXWFStatusLogic(data = {}, conf = {}) {
  return new XWUIComponentLogic(XWF_STATUS_DEFINITION, typeof data === 'string' ? { label: data } : data, conf);
}

/** Pure: unknown kinds fall back to idle so a bad value never breaks a row. */
export function normalizeXWFStatusKind(kind) {
  return XWF_STATUS_KINDS.includes(kind) ? kind : 'idle';
}
