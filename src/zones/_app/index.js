/** App-level pages that belong to no zone (not found, component playground). */
import notFound from './pages/not-found.page.js';
import playground from './pages/playground.page.js';

export const appZone = {
  id: 'app',
  layouts: {},
  pages: [playground],
  notFound,
};
