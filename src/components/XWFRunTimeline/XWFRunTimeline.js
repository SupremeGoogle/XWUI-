/**
 * XWFRunTimeline - component. XWUITimeline lists dated events vertically; a run receipt
 * needs a waterfall on a shared millisecond axis, so this component provides it.
 */
import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { XWF_RUN_TIMELINE_EVENTS } from './XWFRunTimeline.model.js';
import { createXWFRunTimelineLogic, layoutXWFRunTimeline } from './XWFRunTimeline.logic.js';
import { projectXWFRunTimelineView } from './XWFRunTimeline.view.js';

ensureStylesheet('xwf-css-xwfruntimeline', new URL('./XWFRunTimeline.css', import.meta.url));

export class XWFRunTimeline extends XWUIComponent {
  static componentName = 'XWFRunTimeline';

  /**
   * @param {HTMLElement} container
   * @param {{ rows: import('./XWFRunTimeline.model.js').XWFRunTimelineRow[], totalMs?: number, startLabel?: string, endLabel?: string }} data
   * @param {{ labelWidth?: number, minBarPx?: number, selectable?: boolean, className?: string }} conf_comp
   */
  constructor(container, data = {}, conf_comp = {}) {
    super(container, createXWFRunTimelineLogic(data, conf_comp));
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
  }

  renderView() {
    const { labelWidth, minBarPx, selectable, className } = this.config;
    const { rows, totalMs, startLabel, endLabel } = this.data;
    const view = projectXWFRunTimelineView(
      { rows: layoutXWFRunTimeline(rows, totalMs), startLabel, endLabel, labelWidth, minBarPx, selectable },
      { onSelect: (id) => this.select(id) },
    );
    if (className) view.classList.add(className);
    this.container.replaceChildren(view);
  }

  /** Highlight a row and announce it (the receipt opens that attempt). */
  select(id, { silent = false } = {}) {
    this.logic.updateData({ rows: this.data.rows.map((r) => ({ ...r, selected: r.id === id })) });
    if (!silent) this.container.dispatchEvent(new CustomEvent(XWF_RUN_TIMELINE_EVENTS.SELECT, { bubbles: true, detail: { id } }));
  }

  destroy() {
    this.unsubscribe?.();
    super.destroy();
  }
}

createXWUIElement(XWFRunTimeline, 'xwf-run-timeline');
