import { createResourcePage } from '../../shared/resource.page.js';
import { ADMIN_ROUTES } from '../../../core/routes.js';

const resources = {
  tenants: ADMIN_ROUTES.tenants, 'credentials-policy': ADMIN_ROUTES.credentialsPolicy,
  'node-registry': ADMIN_ROUTES.nodeRegistry, adapters: ADMIN_ROUTES.adapters, usage: ADMIN_ROUTES.usage,
  'ai-governance': ADMIN_ROUTES.aiGovernance, schedules: ADMIN_ROUTES.schedules, workers: ADMIN_ROUTES.workers,
  executions: ADMIN_ROUTES.executions, config: ADMIN_ROUTES.config, backups: ADMIN_ROUTES.backups,
};
export default Object.entries(resources).map(([resource, path]) =>
  createResourcePage({ id: `admin-${resource}`, path, layout: 'admin', resource, domain: 'adminApi' }));
