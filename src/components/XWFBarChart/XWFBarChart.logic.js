import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFBarChart.model.js';
export const createXWFBarChartLogic = (data = {}, config = {}) => new XWUIComponentLogic(DEFINITION, data, config);
