import { AdminLayout } from './layout/AdminLayout.js';
import overview from './pages/overview.page.js';
import branding from './pages/branding.page.js';
import audit from './pages/audit.page.js';
import health from './pages/health.page.js';
import denied from './pages/denied.page.js';
import resources from './pages/resources.page.js';
export default {
  id: 'admin',
  layouts: { admin: AdminLayout },
  pages: [overview, branding, audit, health, denied, ...resources],
};
