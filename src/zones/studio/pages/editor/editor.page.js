import { SAVE_DEBOUNCE_MS, SAFE_AREA } from './editor.config.js';
import { createEditorActions } from './editor.actions.js';
import { pageSession } from '../../../../components/xwf-ui.js';
/**
 * Studio: flow editor. Composes the XWFFlowCanvas with the floating header, step palette,
 * inspector and run panel. Edits autosave to the draft; Publish creates a version; Run
 * starts a test run whose steps light up on the canvas as the engine reaches them.
 *
 * Query: ?node=<id> selects a step, ?run=<id> shows that run, ?demo=1 starts a run.
 */

import { h } from '../../../../core/dom.js';

import { template } from '../../../../core/format.js';
import { CANVAS_LAYOUT_ID, STUDIO_ROUTES } from '../../studio.routes.js';
import { XWFFlowCanvas } from '../../../../components/XWFFlowCanvas/XWFFlowCanvas.js';
import { addNode, updateNode, removeNode, removeEdge } from '../../../../components/XWFFlowCanvas/XWFFlowCanvas.logic.js';
import { nodeStatesFromRun, findProblems } from './editor.logic.js';
import { createHeader } from './editor.header.js';
import { createPalette } from './editor.palette.js';
import { createInspector } from './editor.inspector.js';
import { createRunPanel } from './editor.runpanel.js';



export default {
  id: 'studio-editor',
  path: STUDIO_ROUTES.editor,
  layout: CANVAS_LAYOUT_ID,
  async mount(el, ctx) {
    const { studioApi } = ctx.api;
    const page = pageSession(el, ctx);
    const [shell, catalog, flow, connections, flowList] = await Promise.all([
      studioApi.getShell(), studioApi.getCatalog(), studioApi.getFlow(ctx.params.flowId), studioApi.listConnections(),
      studioApi.listFlows(),
    ]);
    if (!page.active) return page.handle;
    const STUDIO_COPY = catalog.copy;
    const C = STUDIO_COPY.editor;
    ctx.setTitle(flow.name);

    const typeIndex = Object.fromEntries(catalog.nodeTypes.map((t) => [t.id, t]));
    const state = {
      name: flow.name,
      graph: flow.graph,
      statusKey: flow.statusKey,
      publishedVersion: flow.publishedVersion,
      selectedId: ctx.query.node ?? '',
      run: flow.lastRun,
      running: false,
      saving: false,
      connections,
      flows: flowList.items.filter(item => item.id !== flow.id),
    };
    if (ctx.query.run) {
      try { state.run = await studioApi.getRun(ctx.query.run); } catch { /* keep the latest run */ }
    }

    /* ---------------------------------------------------------- pieces */
    const canvasHost = h('div', { class: 'editor-canvas' });
    const header = createHeader({ ctx, flow, project: shell.project, catalog, copy: C, handlers: {
      onTab: (key) => {
        if (key === 'runs') ctx.navigate(ctx.href(STUDIO_ROUTES.runs, {}, { flow: flow.id }).slice(1));
        else if (key === 'all') ctx.navigate(ctx.href(STUDIO_ROUTES.notations, {}, { flow: flow.id }).slice(1));
        else if (key === 'versions') openVersions();
        else ctx.navigate(ctx.href(STUDIO_ROUTES.view, { flowId: flow.id, notation: key }).slice(1));
      },
      onRun: () => startRun(),
      onPublish: () => publish(),
      onAsk: () => ask(),
    } });
    const palette = createPalette({ catalog, copy: C, onAdd: (type) => addStep(type) });
    const inspector = createInspector({ catalog, copy: C, handlers: {
      onParams: (id, params) => {
        const node = state.graph.nodes.find((n) => n.id === id);
        commit(updateNode(state.graph, id, { params: { ...node.params, ...params } }), { inspector: false });
      },
      onNode: (id, patch) => commit(updateNode(state.graph, id, patch), { inspector: !Object.hasOwn(patch, 'notes') }),
      onExecuteTo: (id) => startRun({ stopAtNodeId: id }),
      onDelete: (id) => deleteSelection(id),
    } });
    const runPanel = createRunPanel({ ctx, catalog, copy: C, onWaitResolved: (next) => {
      state.run = next;
      state.running = false;
      canvas.setNodeStates(nodeStatesFromRun(state.graph, next, catalog, C.nodeStates));
      refreshPanels();
    } });

    el.replaceChildren(h('div', { class: 'editor' }, canvasHost, header.el, palette.el, inspector.el, runPanel.el));

    const canvas = page.scope.mount(XWFFlowCanvas, canvasHost, {
      graph: state.graph,
      nodeTypes: typeIndex,
      nodeStates: nodeStatesFromRun(state.graph, state.run, catalog, C.nodeStates),
      selectedId: state.selectedId,
      portLabels: C.ports,
      labels: C.tools,
    }, { safeArea: SAFE_AREA });
    const fitViewport = () => {
      canvas.updateConfig({ safeArea: el.clientWidth <= 1200 ? { left: 222, right: 302, top: 144, bottom: 282 } : SAFE_AREA });
      canvas.fit();
    };
    page.scope.listen(window, 'resize', fitViewport);
    requestAnimationFrame(fitViewport);

    /* ---------------------------------------------------------- state sync */
    function problems() {
      return findProblems(state.graph, typeIndex, C.problems);
    }

    function refreshPanels({ inspector: withInspector = true } = {}) {
      header.update({ ...state });
      if (withInspector) inspector.render({ ...state, lastRun: state.run });
      runPanel.render({ run: state.run, problems: problems(), selectedId: state.selectedId });
    }

    let saveTimer = null;
    function scheduleSave() {
      clearTimeout(saveTimer);
      state.saving = true;
      saveTimer = setTimeout(async () => {
        try {
          const saved = await studioApi.saveDraft(flow.id, state.graph);
          state.statusKey = saved.statusKey;
        } catch (error) {
          ctx.notify.fromError(error);
        } finally {
          state.saving = false;
          header.update({ ...state });
        }
      }, SAVE_DEBOUNCE_MS);
    }

    function commit(graph, { inspector: withInspector = true, fromCanvas = false } = {}) {
      state.graph = graph;
      state.statusKey = state.publishedVersion ? 'changes' : 'draft';
      if (!fromCanvas) canvas.setGraph(graph);
      canvas.setNodeStates(nodeStatesFromRun(graph, state.run, catalog, C.nodeStates));
      scheduleSave();
      refreshPanels({ inspector: withInspector });
    }

    page.scope.listen(canvasHost, 'xwf-change', (e) => commit(e.detail.graph, { fromCanvas: true }));
    page.scope.listen(canvasHost, 'xwf-select', (e) => {
      state.selectedId = e.detail.id;
      refreshPanels();
    });
    page.scope.listen(canvasHost, 'xwf-activate', (e) => rename(e.detail.id));
    page.scope.listen(canvasHost, 'xwf-drop-type', (e) => addStep(e.detail.type, { at: { x: e.detail.x, y: e.detail.y } }));

    /* ---------------------------------------------------------- actions */
    function addStep(typeId, { at = null, name = null } = {}) {
      const type = typeIndex[typeId];
      const params = Object.fromEntries((type.fields ?? []).map((f) => [f.key, f.default]));
      const after = at ? null : (state.graph.nodes.some((n) => n.id === state.selectedId) ? state.selectedId : state.graph.nodes.at(-1)?.id ?? null);
      const result = addNode(state.graph, { type: typeId, name: name ?? type.label, params, at, after }, typeIndex, canvas.config.nodeWidth);
      state.selectedId = result.id;
      canvas.setSelected(result.id);
      commit(result.graph);
      canvas.focusNode(result.id);
      ctx.notify.success(template(C.stepAdded, { name: name ?? type.label }));
    }

    function deleteSelection(id = state.selectedId) {
      if (!id) return;
      const isNode = state.graph.nodes.some((n) => n.id === id);
      const graph = isNode ? removeNode(state.graph, id) : removeEdge(state.graph, id);
      state.selectedId = '';
      canvas.setSelected('');
      commit(graph);
      if (isNode) {
        requestAnimationFrame(() => canvas.fit());
        ctx.notify.info(C.stepDeleted);
      }
    }

    const { rename, startRun, publish, openVersions, ask } = createEditorActions({
      ctx, studioApi, state, flow, page, C, catalog, canvas, header, runPanel, commit, addStep, problems, refreshPanels,
      cancelSave: () => clearTimeout(saveTimer),
    });

    /* ---------------------------------------------------------- keyboard */
    const onKey = (e) => {
      const typing = e.target.closest('input, textarea, select, [contenteditable="true"]');
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); startRun(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); ask(); return; }
      if (typing) return;
      if (e.key === 'F2' && state.selectedId) { e.preventDefault(); rename(state.selectedId); }
      if ((e.key === 'p' || e.key === 'P') && state.graph.nodes.some((n) => n.id === state.selectedId)) {
        const node = state.graph.nodes.find((n) => n.id === state.selectedId);
        commit(updateNode(state.graph, node.id, { pinned: !node.pinned }));
      }
      if (e.key === 'Tab' && document.activeElement === document.body) { e.preventDefault(); palette.focusSearch(); }
    };
    page.scope.listen(window, 'keydown', onKey);

    refreshPanels();
    if (state.selectedId) requestAnimationFrame(() => canvas.focusNode(state.selectedId));
    const demoTimer = ctx.query.demo ? setTimeout(() => startRun(), 400) : null;
    // deep link from the integrations directory: ?nodeType=http-request adds that step
    const linkedType = ctx.query.nodeType?.replace(/-/g, '_');
    const linkedTimer = linkedType && typeIndex[linkedType] ? setTimeout(() => addStep(linkedType), 300) : null;
    page.scope.onDispose(() => { clearTimeout(demoTimer); clearTimeout(linkedTimer); });

    return {
      unmount() {
        clearTimeout(saveTimer);
        if (state.saving) studioApi.saveDraft(flow.id, state.graph).catch(() => {});
        header.destroy();
        palette.destroy();
        inspector.destroy();
        runPanel.destroy();
        page.scope.destroy();
      },
    };
  },
};
