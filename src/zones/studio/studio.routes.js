/** Studio layout IDs and route highlighting. Navigation paths live in core/routes.js. */
import { STUDIO_ROUTES } from '../../core/routes.js';
export { STUDIO_ROUTES } from '../../core/routes.js';
export const STUDIO_LAYOUT_ID = 'studio';
export const CANVAS_LAYOUT_ID = 'studio-canvas';
export function studioRouteToNavId({ path, query }) {
  if (path === STUDIO_ROUTES.assistant) return query.chat ? `chat_${query.chat}` : 'assistant';
  if ([STUDIO_ROUTES.templates, STUDIO_ROUTES.insights, STUDIO_ROUTES.settings].includes(path)) return Object.entries(STUDIO_ROUTES).find(([, route]) => route === path)[0];
  if (Object.values(STUDIO_ROUTES).some(prefix => prefix !== STUDIO_ROUTES.assistant && path.startsWith(prefix))) return 'project';
  return '';
}
