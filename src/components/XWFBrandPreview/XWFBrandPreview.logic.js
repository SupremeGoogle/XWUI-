import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFBrandPreview.model.js';
export const createXWFBrandPreviewLogic = (data = {}, config = {}) =>
  new XWUIComponentLogic(DEFINITION, data, config);
