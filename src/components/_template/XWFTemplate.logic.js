/**
 * XWFTemplate - logic.
 * Owns state through XWUIComponentLogic (data + effective config + subscribers) and
 * exposes pure helpers for derived state. No DOM access here.
 */
import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { XWF_TEMPLATE_DEFINITION, XWF_TEMPLATE_TONES } from './XWFTemplate.model.js';

export function createXWFTemplateLogic(data = {}, conf = {}) {
  return new XWUIComponentLogic(XWF_TEMPLATE_DEFINITION, data, conf);
}

/** Pure: the list the view renders, with selection and a stable tone per item. */
export function deriveXWFTemplateItems(items = [], selectedId = '') {
  return items.map((item, index) => ({
    ...item,
    tone: item.tone ?? XWF_TEMPLATE_TONES[index % XWF_TEMPLATE_TONES.length],
    selected: item.id === selectedId,
  }));
}

/** Pure: next selection when an item is activated (activating the selected one clears it). */
export function nextXWFTemplateSelection(currentId, activatedId) {
  return currentId === activatedId ? '' : activatedId;
}
