import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFHealthCheck.model.js';
export const createXWFHealthCheckLogic = (data = {}, config = {}) =>
  new XWUIComponentLogic(DEFINITION, data, config);
