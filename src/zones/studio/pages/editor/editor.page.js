/**
 * Studio: flow editor. Composes the XWFFlowCanvas with the floating header, step palette,
 * inspector and run panel. Edits autosave to the draft; Publish creates a version; Run
 * starts a test run whose steps light up on the canvas as the engine reaches them.
 *
 * Query: ?node=<id> selects a step, ?run=<id> shows that run, ?demo=1 starts a run.
 */
import { XWUIInputText, XWUITextarea, XWUIOverlaySideSheet } from '@exonware/xwui/basic';
import { h } from '../../../../core/dom.js';
import { createKit } from '../../../../core/ui.js';
import { template, formatRelative } from '../../../../core/format.js';
import { CANVAS_LAYOUT_ID, STUDIO_ROUTES } from '../../studio.routes.js';
import { XWFFlowCanvas } from '../../../../components/XWFFlowCanvas/XWFFlowCanvas.js';
import { addNode, updateNode, removeNode, removeEdge } from '../../../../components/XWFFlowCanvas/XWFFlowCanvas.logic.js';
import { nodeStatesFromRun, findProblems } from './editor.logic.js';
import { createHeader } from './editor.header.js';
import { createPalette } from './editor.palette.js';
import { createInspector } from './editor.inspector.js';
import { createRunPanel } from './editor.runpanel.js';

const SAVE_DEBOUNCE_MS = 600;
const RUN_POLL_MS = 350;
/** Screen area the floating panels cover (px), so "fit" keeps steps visible. */
const SAFE_AREA = { left: 282, right: 372, top: 94, bottom: 282 };

export default {
  id: 'studio-editor',
  path: STUDIO_ROUTES.editor,
  layout: CANVAS_LAYOUT_ID,
  async mount(el, ctx) {
    const { studioApi } = ctx.api;
    const page = createKit();
    const [shell, catalog, flow, connections, flowList] = await Promise.all([
      studioApi.getShell(), studioApi.getCatalog(), studioApi.getFlow(ctx.params.flowId), studioApi.listConnections(),
      studioApi.listFlows(),
    ]);
    if (ctx.isActive && !ctx.isActive()) { page.scope.destroy(); return { unmount() {} }; }
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
    const runPanel = createRunPanel({ ctx, catalog, copy: C });

    el.append(h('div', { class: 'editor' }, canvasHost, header.el, palette.el, inspector.el, runPanel.el));

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

    async function rename(id) {
      const node = state.graph.nodes.find((n) => n.id === id);
      if (!node) return;
      const { scope } = createKit();
      const host = h('div');
      const input = scope.mountField(XWUIInputText, host, { value: node.name, label: C.renameLabel }, { fullWidth: true });
      requestAnimationFrame(() => { input.focus?.(); input.select?.(); });
      const choice = await page.ui.dialog({ title: C.renameTitle, content: host, actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'ok', label: C.renameConfirm, variant: 'primary' }], size: 'sm' });
      const value = input.getValue?.()?.trim();
      scope.destroy();
      if (choice === 'ok' && value) commit(updateNode(state.graph, id, { name: value }));
    }

    let poll = null;
    async function startRun({ stopAtNodeId = null } = {}) {
      if (state.running) return;
      clearTimeout(saveTimer);
      try {
        await studioApi.saveDraft(flow.id, state.graph);
        state.saving = false;
        state.running = true;
        header.update({ ...state });
        const { id } = await studioApi.startRun(flow.id, { mode: 'test', stopAtNodeId });
        ctx.notify.info(C.runStarted);
        const tick = async () => {
          try {
            const run = await studioApi.getRun(id);
            state.run = run;
            canvas.setNodeStates(nodeStatesFromRun(state.graph, run, catalog, C.nodeStates));
            runPanel.render({ run, problems: problems(), selectedId: state.selectedId });
            if (run.status === 'running') { poll = setTimeout(tick, RUN_POLL_MS); return; }
            state.running = false;
            refreshPanels({ inspector: false });
            const status = catalog.runStatuses[run.status];
            ctx.notify[run.status === 'failed' ? 'error' : 'success'](template(C.runFinished, { status: status.label.toLowerCase() }), {
              action: { label: C.openReceipt, onClick: () => ctx.navigate(`/studio/runs/${run.id}`) },
            });
          } catch (error) {
            state.running = false;
            header.update({ ...state });
            ctx.notify.fromError(error);
          }
        };
        tick();
      } catch (error) {
        state.running = false;
        header.update({ ...state });
        ctx.notify.fromError(error);
      }
    }

    async function publish() {
      if (state.statusKey === 'published') {
        ctx.notify.info(template(C.nothingToPublish, { v: state.publishedVersion }));
        return;
      }
      const next = (state.publishedVersion ?? 0) + 1;
      const { scope } = createKit();
      const host = h('div', { class: 'stack gap12' }, h('p', { class: 'small sec' }, C.publishBody));
      const noteHost = h('div');
      host.append(noteHost);
      const note = scope.mountField(XWUITextarea, noteHost, { label: C.publishNoteLabel, placeholder: C.publishNotePlaceholder, rows: '3' }, { fullWidth: true });
      const choice = await page.ui.dialog({
        title: template(C.publishTitle, { v: next }), content: host,
        actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'publish', label: C.publishConfirm, variant: 'primary' }],
        size: 'sm',
      });
      const text = note.getValue?.() ?? '';
      scope.destroy();
      if (choice !== 'publish') return;
      try {
        clearTimeout(saveTimer);
        await studioApi.saveDraft(flow.id, state.graph);
        const result = await studioApi.publishFlow(flow.id, { note: text });
        state.publishedVersion = result.version;
        state.statusKey = 'published';
        state.saving = false;
        refreshPanels({ inspector: false });
        ctx.notify.success(template(C.publishDone, { v: result.version }));
      } catch (error) { ctx.notify.fromError(error); }
    }

    async function openVersions() {
      const latest = await studioApi.getFlow(flow.id);
      const { scope, ui } = createKit();
      const host = h('div');
      document.body.append(host);
      const list = h('div', { class: 'stack gap12 editor-versions' }, latest.versions.map((v) => h('div', { class: 'glass pad-s stack gap8' },
        h('div', { class: 'rowf gap8' }, h('b', {}, `v${v.version}`), v.version === latest.publishedVersion && ui.tag(C.versionsCurrent, 'primary'), h('span', { class: 'xs ter sp' }, template(C.versionBy, { who: v.publishedByName, when: formatRelative(v.publishedAt) }))),
        v.note && h('p', { class: 'small sec' }, v.note),
        ui.button(C.restore, { variant: 'secondary', size: 'sm', icon: 'history', onClick: async () => {
          try {
            await studioApi.restoreVersion(flow.id, v.version);
            const restored = await studioApi.getFlow(flow.id);
            state.graph = restored.graph;
            state.statusKey = restored.statusKey;
            canvas.setGraph(restored.graph);
            canvas.setNodeStates(nodeStatesFromRun(restored.graph, state.run, catalog, C.nodeStates));
            refreshPanels();
            ctx.notify.success(template(C.restored, { v: v.version }));
            sheet.close?.();
          } catch (error) { ctx.notify.fromError(error); }
        } }))));
      const sheet = new XWUIOverlaySideSheet(host, { title: C.versionsTitle, content: list, open: true }, { placement: 'end', width: '380px', closable: true });
      sheet.open?.();
      const cleanup = () => { scope.destroy(); try { sheet.destroy(); } catch { /* gone */ } host.remove(); };
      sheet.onClose?.(cleanup);
      page.scope.onDispose(cleanup);
    }

    async function ask() {
      const { scope, ui } = createKit();
      const examples = (await studioApi.getEditorAssistant()).examples;
      const host = h('div', { class: 'stack gap12' });
      const inputHost = h('div');
      host.append(inputHost, h('div', { class: 'wrapf gap8' }, examples.map((ex) => ui.button(ex, { variant: 'ghost', size: 'sm', onClick: () => input.setValue?.(ex) }))));
      const input = scope.mountField(XWUIInputText, inputHost, { label: C.askLabel, placeholder: C.askPlaceholder }, { fullWidth: true, leadingIcon: 'sparkles' });
      requestAnimationFrame(() => input.focus?.());
      const choice = await page.ui.dialog({ title: C.askTitle, content: host, actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'ask', label: C.askConfirm, variant: 'primary' }], size: 'md' });
      const text = input.getValue?.() || C.askPlaceholder;
      scope.destroy();
      if (choice !== 'ask') return;
      try {
        const answer = await studioApi.askAssistant({ flowId: flow.id, text });
        if (answer.kind === 'add') {
          addStep(answer.type, { name: answer.name.charAt(0).toUpperCase() + answer.name.slice(1) });
        } else {
          await page.ui.dialog({ title: C.explainTitle, content: h('div', { class: 'stack gap8' }, answer.sentences.map((s) => h('p', {}, s))), actions: [{ id: 'close', label: C.close, variant: 'secondary' }] });
        }
      } catch (error) { ctx.notify.fromError(error); }
    }

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
        clearTimeout(poll);
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
