import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFPricingTiersLogic } from './XWFPricingTiers.logic.js';
import { projectXWFPricingTiersView } from './XWFPricingTiers.view.js';
/** Specialized visual composed of XWUI basic primitives. */
export class XWFPricingTiers extends XWUIComponent {
 static componentName = 'XWFPricingTiers';
 constructor(container, data = {}, conf_comp = {}) {
  ensureStylesheet('xwui-css-xwfpricingtiers', new URL('./XWFPricingTiers.css', import.meta.url));
  super(container, createXWFPricingTiersLogic(data, conf_comp));
  this.kit = null;
  this.unsubscribe = this.logic.subscribe(() => this.renderView());
  this.renderView();
 }
 renderView() {
  this.kit?.scope.destroy();
  this.kit = createXwfKit(this);
  this.container.replaceChildren(projectXWFPricingTiersView(this.data, { onAction: (detail) => this.container.dispatchEvent(new CustomEvent('xwf-action', { bubbles: true, detail })) }, this.kit.ui));
 }
 destroy() { this.unsubscribe?.(); this.kit?.scope.destroy(); this.kit = null; super.destroy(); }
}
createXWUIElement(XWFPricingTiers, 'xwf-pricing-tiers');
