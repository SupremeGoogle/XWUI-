import { createResourcePage } from '../../shared/resource.page.js';
import { STUDIO_ROUTES } from '../studio.routes.js';

export default ['agents', 'tables', 'forms', 'variables', 'mcp', 'templates', 'insights', 'settings'].map(resource =>
  createResourcePage({ id: `studio-${resource}`, path: STUDIO_ROUTES[resource], layout: 'studio', resource, domain: 'studioApi' }));
