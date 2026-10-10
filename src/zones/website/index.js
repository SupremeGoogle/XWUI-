import { WebsiteLayout } from './layout/WebsiteLayout.js';
import landing from './pages/landing.page.js';
import integrations from './pages/integrations.page.js';
import pricing from './pages/pricing.page.js';
import selfHost from './pages/self-host.page.js';
export default { id: 'website', layouts: { website: WebsiteLayout }, pages: [landing, integrations, pricing, selfHost] };
