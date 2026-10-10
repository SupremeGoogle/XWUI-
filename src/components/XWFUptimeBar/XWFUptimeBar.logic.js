import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFUptimeBar.model.js';
export const createXWFUptimeBarLogic = (data = {}, config = {}) =>
  new XWUIComponentLogic(DEFINITION, data, config);
