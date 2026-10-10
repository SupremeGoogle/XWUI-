import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { ensureStylesheet } from '../../core/dom.js';
import { createXwfKit } from '../xwf-ui.js';
import { createXWFBrandPreviewLogic } from './XWFBrandPreview.logic.js';
import { projectXWFBrandPreviewView } from './XWFBrandPreview.view.js';
/** Specialized visual composed of XWUI basic primitives. */
export class XWFBrandPreview extends XWUIComponent {
 static componentName = 'XWFBrandPreview';
 constructor(container, data = {}, conf_comp = {}) {
  ensureStylesheet('xwui-css-xwfbrandpreview', new URL('./XWFBrandPreview.css', import.meta.url));
  super(container, createXWFBrandPreviewLogic(data, conf_comp));
  this.kit = null;
  this.unsubscribe = this.logic.subscribe(() => this.renderView());
  this.renderView();
 }
 renderView() {
  this.kit?.scope.destroy();
  this.kit = createXwfKit(this);
  this.container.replaceChildren(projectXWFBrandPreviewView(this.data, { onAction: (detail) => this.container.dispatchEvent(new CustomEvent('xwf-action', { bubbles: true, detail })) }, this.kit.ui));
 }
 destroy() { this.unsubscribe?.(); this.kit?.scope.destroy(); this.kit = null; super.destroy(); }
}
createXWUIElement(XWFBrandPreview, 'xwf-brand-preview');
