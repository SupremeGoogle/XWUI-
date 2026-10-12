import { RUN_POLL_MS } from './editor.config.js';

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
import { STUDIO_ROUTES } from '../../studio.routes.js';
import { XWFFlowCanvas } from '../../../../components/XWFFlowCanvas/XWFFlowCanvas.js';
import { updateNode } from '../../../../components/XWFFlowCanvas/XWFFlowCanvas.logic.js';
import { nodeStatesFromRun } from './editor.logic.js';







export function createEditorActions({ ctx, studioApi, state, flow, page, C, catalog, canvas, header, runPanel, commit, addStep, problems, refreshPanels, cancelSave }) {
    async function rename(id) {
      const node = state.graph.nodes.find((n) => n.id === id);
      if (!node) return;
      const { scope } = createKit();
      const host = h('div');
      const input = scope.mountField(XWUIInputText, host, { value: node.name, label: C.renameLabel }, { fullWidth: true });
      requestAnimationFrame(() => { input.focus(); input.getInputElement().select(); });
      const choice = await page.ui.dialog({ title: C.renameTitle, content: host, actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'ok', label: C.renameConfirm, variant: 'primary' }], size: 'sm' });
      const value = input.getValue()?.trim();
      scope.destroy();
      if (choice === 'ok' && value) commit(updateNode(state.graph, id, { name: value }));
    }

    let poll = null;
    async function startRun({ stopAtNodeId = null } = {}) {
      if (state.running) return;
      cancelSave();
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
            ctx.notify[run.status === 'waiting' ? 'info' : run.status === 'failed' ? 'error' : 'success'](run.status === 'waiting' ? C.runPaused : template(C.runFinished, { status: status.label.toLowerCase() }), {
              action: { label: C.openReceipt, onClick: () => ctx.navigate(ctx.href(STUDIO_ROUTES.run, { runId: run.id }).slice(1)) },
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
      const text = note.getValue() ?? '';
      scope.destroy();
      if (choice !== 'publish') return;
      try {
        cancelSave();
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
            sheet.close();
          } catch (error) { ctx.notify.fromError(error); }
        } }))));
      const sheet = new XWUIOverlaySideSheet(host, { title: C.versionsTitle, content: list, open: true }, { placement: 'end', width: '380px', closable: true });
      sheet.open();
      const cleanup = () => { scope.destroy(); try { sheet.destroy(); } catch { /* gone */ } host.remove(); };
      sheet.onClose(cleanup);
      page.scope.onDispose(cleanup);
    }

    async function ask() {
      const { scope, ui } = createKit();
      const examples = (await studioApi.getEditorAssistant()).examples;
      const host = h('div', { class: 'stack gap12' });
      const inputHost = h('div');
      host.append(inputHost, h('div', { class: 'wrapf gap8' }, examples.map((ex) => ui.button(ex, { variant: 'ghost', size: 'sm', onClick: () => input.setValue(ex) }))));
      const input = scope.mountField(XWUIInputText, inputHost, { label: C.askLabel, placeholder: C.askPlaceholder }, { fullWidth: true, leadingIcon: 'sparkles' });
      requestAnimationFrame(() => input.focus());
      const choice = await page.ui.dialog({ title: C.askTitle, content: host, actions: [{ id: 'cancel', label: C.cancel, variant: 'ghost' }, { id: 'ask', label: C.askConfirm, variant: 'primary' }], size: 'md' });
      const text = input.getValue() || C.askPlaceholder;
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

  page.scope.onDispose(() => clearTimeout(poll));
  return { rename, startRun, publish, openVersions, ask };
}
