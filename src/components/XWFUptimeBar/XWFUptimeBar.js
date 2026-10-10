import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFUptimeBarLogic } from './XWFUptimeBar.logic.js';
import { projectXWFUptimeBarView } from './XWFUptimeBar.view.js';
/** Specialized visual composed of XWUI basic primitives. */
export class XWFUptimeBar extends XWUIComponent {
  static componentName = 'XWFUptimeBar';
  constructor(container, data = {}, conf_comp = {}) {
    ensureStylesheet(
      'xwui-css-xwfuptimebar',
      new URL('./XWFUptimeBar.css', import.meta.url),
    );
    super(container, createXWFUptimeBarLogic(data, conf_comp));
    this.kit = null;
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
  }
  renderView() {
    this.kit?.scope.destroy();
    this.kit = createXwfKit(this);
    this.container.replaceChildren(
      projectXWFUptimeBarView(
        this.data,
        {
          onAction: (detail) =>
            this.container.dispatchEvent(
              new CustomEvent('xwf-action', { bubbles: true, detail }),
            ),
        },
        this.kit.ui,
      ),
    );
  }
  destroy() {
    this.unsubscribe?.();
    this.kit?.scope.destroy();
    this.kit = null;
    super.destroy();
  }
}
createXWUIElement(XWFUptimeBar, 'xwf-uptime-bar');
