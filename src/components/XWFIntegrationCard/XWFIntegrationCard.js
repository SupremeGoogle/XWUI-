import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFIntegrationCardLogic } from './XWFIntegrationCard.logic.js';
import { projectXWFIntegrationCardView } from './XWFIntegrationCard.view.js';
/** Specialized visual composed of XWUI basic primitives. */
export class XWFIntegrationCard extends XWUIComponent {
 static componentName = 'XWFIntegrationCard';
 constructor(container, data = {}, conf_comp = {}) {
  ensureStylesheet('xwui-css-xwfintegrationcard', new URL('./XWFIntegrationCard.css', import.meta.url));
  super(container, createXWFIntegrationCardLogic(data, conf_comp));
  this.kit = null;
  this.unsubscribe = this.logic.subscribe(() => this.renderView());
  this.renderView();
 }
 renderView() {
  this.kit?.scope.destroy();
  this.kit = createXwfKit(this);
  this.container.replaceChildren(projectXWFIntegrationCardView(this.data, { onAction: (detail) => this.container.dispatchEvent(new CustomEvent('xwf-action', { bubbles: true, detail })) }, this.kit.ui));
 }
 destroy() { this.unsubscribe?.(); this.kit?.scope.destroy(); this.kit = null; super.destroy(); }
}
createXWUIElement(XWFIntegrationCard, 'xwf-integration-card');
