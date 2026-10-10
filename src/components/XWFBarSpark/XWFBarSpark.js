/**
 * XWFBarSpark - component. XWUIDisplaySparkline draws lines only and the chart tier is
 * licensed, so the prototype's bar sparkline is built here on the XWUI base.
 */
import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXWFBarSparkLogic, deriveXWFBarSparkBars } from './XWFBarSpark.logic.js';
import { projectXWFBarSparkView } from './XWFBarSpark.view.js';

ensureStylesheet('xwf-css-xwfbarspark', new URL('./XWFBarSpark.css', import.meta.url));

export class XWFBarSpark extends XWUIComponent {
  static componentName = 'XWFBarSpark';

  /**
   * @param {HTMLElement} container
   * @param {{ buckets: import('./XWFBarSpark.model.js').XWFBarSparkBucket[], ariaLabel?: string }} data
   * @param {{ height?: number, gap?: number, minBarPercent?: number, className?: string }} conf_comp
   */
  constructor(container, data = {}, conf_comp = {}) {
    super(container, createXWFBarSparkLogic(data, conf_comp));
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
  }

  renderView() {
    const { height, gap, minBarPercent, className } = this.config;
    this.container.replaceChildren(projectXWFBarSparkView({
      bars: deriveXWFBarSparkBars(this.data.buckets, minBarPercent), ariaLabel: this.data.ariaLabel, height, gap, className,
    }));
  }

  setBuckets(buckets) {
    this.logic.updateData({ buckets });
  }

  destroy() {
    this.unsubscribe?.();
    super.destroy();
  }
}

createXWUIElement(XWFBarSpark, 'xwf-bar-spark');
