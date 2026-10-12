/** Studio layout IDs and route highlighting. Navigation paths live in core/routes.js. */
import { STUDIO_ROUTES } from '../../core/routes.js';
export { STUDIO_ROUTES } from '../../core/routes.js';
export const STUDIO_LAYOUT_ID = 'studio';
export const CANVAS_LAYOUT_ID = 'studio-canvas';
export function studioRouteToNavId({ path, query }) {
  if (path === STUDIO_ROUTES.assistant) return query.chat ? `chat_${query.chat}` : 'assistant';
  if ([STUDIO_ROUTES.flows, STUDIO_ROUTES.runs, STUDIO_ROUTES.connections].some(prefix => path.startsWith(prefix))) return 'project';
  return '';
}
