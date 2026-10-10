/** Studio route table (single source for paths used by pages, links and the rail). */
export const STUDIO_LAYOUT_ID = 'studio';
export const CANVAS_LAYOUT_ID = 'studio-canvas';

export const STUDIO_ROUTES = Object.freeze({
  assistant: '/studio',
  flows: '/studio/flows',
  editor: '/studio/flows/:flowId',
  view: '/studio/flows/:flowId/view/:notation',
  runs: '/studio/runs',
  run: '/studio/runs/:runId',
  connections: '/studio/connections',
  notations: '/notations',
});

/** Which rail entry is highlighted for a route. */
export function studioRouteToNavId(route) {
  const { path, query } = route;
  if (path === STUDIO_ROUTES.assistant) return query.chat ? `chat_${query.chat}` : 'assistant';
  if (path.startsWith('/studio/flows') || path.startsWith('/studio/runs') || path.startsWith('/studio/connections')) return 'project';
  return '';
}
