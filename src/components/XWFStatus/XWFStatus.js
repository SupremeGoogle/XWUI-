/**
 * XWFStatus - component. XWUI basic has no shaped status marker (XWUIDisplayStatus is an
 * abstract base that renders nothing), so this fills the gap with the prototype's `.st`.
 */
import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXWFStatusLogic, normalizeXWFStatusKind } from './XWFStatus.logic.js';
import { projectXWFStatusView } from './XWFStatus.view.js';

ensureStylesheet('xwf-css-xwfstatus', new URL('./XWFStatus.css', import.meta.url));

export class XWFStatus extends XWUIComponent {
  static componentName = 'XWFStatus';

  /**
   * @param {HTMLElement} container
   * @param {{ label: string }|string} data
   * @param {{ kind?: 'ok'|'err'|'warn'|'run'|'idle'|'pin'|'dis', size?: 'sm'|'md'|'lg', className?: string }} conf_comp
   */
  constructor(container, data = {}, conf_comp = {}) {
    super(container, createXWFStatusLogic(data, conf_comp));
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
  }

  renderView() {
    const { kind, size, className } = this.config;
    this.container.replaceChildren(projectXWFStatusView({ label: this.data.label, kind: normalizeXWFStatusKind(kind), size, className }));
  }

  setStatus(label, kind) {
    this.logic.updateData({ label });
    if (kind) this.logic.updateConfig({ kind });
  }

  destroy() {
    this.unsubscribe?.();
    super.destroy();
  }
}

createXWUIElement(XWFStatus, 'xwf-status');
