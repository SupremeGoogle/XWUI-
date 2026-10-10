/** Studio zone manifest. */
import { StudioLayout } from './layout/StudioLayout.js';
import { STUDIO_LAYOUT_ID } from './studio.routes.js';
import flows from './pages/flows.page.js';

export default {
  id: 'studio',
  layouts: { [STUDIO_LAYOUT_ID]: StudioLayout },
  pages: [flows],
};
