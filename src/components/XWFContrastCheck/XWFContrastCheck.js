import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFContrastCheckLogic } from './XWFContrastCheck.logic.js';
import { projectXWFContrastCheckView } from './XWFContrastCheck.view.js';
/** Specialized visual composed of XWUI basic primitives. */
export class XWFContrastCheck extends XWUIComponent {
 static componentName = 'XWFContrastCheck';
 constructor(container, data = {}, conf_comp = {}) {
  ensureStylesheet('xwui-css-xwfcontrastcheck', new URL('./XWFContrastCheck.css', import.meta.url));
  super(container, createXWFContrastCheckLogic(data, conf_comp));
  this.kit = null;
  this.unsubscribe = this.logic.subscribe(() => this.renderView());
  this.renderView();
 }
 renderView() {
  this.kit?.scope.destroy();
  this.kit = createXwfKit(this);
  this.container.replaceChildren(projectXWFContrastCheckView(this.data, { onAction: (detail) => this.container.dispatchEvent(new CustomEvent('xwf-action', { bubbles: true, detail })) }, this.kit.ui));
 }
 destroy() { this.unsubscribe?.(); this.kit?.scope.destroy(); this.kit = null; super.destroy(); }
}
createXWUIElement(XWFContrastCheck, 'xwf-contrast-check');
