/** Studio zone manifest. */
import { StudioLayout } from './layout/StudioLayout.js';
import { CanvasLayout } from './layout/CanvasLayout.js';
import { STUDIO_LAYOUT_ID, CANVAS_LAYOUT_ID } from './studio.routes.js';
import flows from './pages/flows.page.js';
import runs from './pages/runs.page.js';
import run from './pages/run.page.js';
import editor from './pages/editor/editor.page.js';
import view from './pages/view.page.js';
import assistant from './pages/assistant.page.js';

export default {
  id: 'studio',
  layouts: { [STUDIO_LAYOUT_ID]: StudioLayout, [CANVAS_LAYOUT_ID]: CanvasLayout },
  pages: [assistant, flows, runs, run, editor, view],
};
