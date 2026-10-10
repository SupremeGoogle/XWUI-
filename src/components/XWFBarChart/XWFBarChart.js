import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFBarChartLogic } from './XWFBarChart.logic.js';
import { projectXWFBarChartView } from './XWFBarChart.view.js';
/** Specialized visual composed of XWUI basic primitives. */
export class XWFBarChart extends XWUIComponent {
  static componentName = 'XWFBarChart';
  constructor(container, data = {}, conf_comp = {}) {
    ensureStylesheet(
      'xwui-css-xwfbarchart',
      new URL('./XWFBarChart.css', import.meta.url),
    );
    super(container, createXWFBarChartLogic(data, conf_comp));
    this.kit = null;
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
  }
  renderView() {
    this.kit?.scope.destroy();
    this.kit = createXwfKit(this);
    this.container.replaceChildren(
      projectXWFBarChartView(
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
createXWUIElement(XWFBarChart, 'xwf-bar-chart');
