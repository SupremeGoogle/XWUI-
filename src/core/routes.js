/** Canonical navigation paths; data records and UI links share these tables. */
export const WEBSITE_ROUTES = Object.freeze({
  home: '/', integrations: '/integrations', pricing: '/pricing', selfHost: '/self-host', notations: '/notations',
});
export const STUDIO_ROUTES = Object.freeze({
  assistant: '/studio', flows: '/studio/flows', editor: '/studio/flows/:flowId',
  view: '/studio/flows/:flowId/view/:notation', runs: '/studio/runs', run: '/studio/runs/:runId',
  agents: '/studio/agents', tables: '/studio/tables', forms: '/studio/forms', variables: '/studio/variables',
  mcp: '/studio/mcp', templates: '/studio/templates', insights: '/studio/insights', settings: '/studio/settings',
  connections: '/studio/connections', notations: WEBSITE_ROUTES.notations,
});
export const ADMIN_ROUTES = Object.freeze({
  overview: '/admin', branding: '/admin/branding', audit: '/admin/audit', health: '/system/health',
  tenants: '/admin/tenants', credentialsPolicy: '/admin/credentials-policy', nodeRegistry: '/admin/node-registry',
  adapters: '/admin/adapters', usage: '/admin/usage', aiGovernance: '/admin/ai-governance', schedules: '/admin/schedules',
  workers: '/admin/workers', executions: '/admin/executions', config: '/admin/config', backups: '/admin/backups',
  quotas: '/admin/quotas', section: '/admin/:section',
});
export const APP_ROUTES = Object.freeze({ notFound: '/__not-found__' });
