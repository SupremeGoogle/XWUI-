/** App-level fallback page shared by all zones. */
import notFound from './pages/not-found.page.js';

export const appZone = {
  id: 'app',
  layouts: {},
  pages: [],
  notFound,
};
