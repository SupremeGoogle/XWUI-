import { pageSession } from '../../../components/xwf-ui.js';
/**
 * Studio: assistant home. Describe a job; the assistant drafts a flow (read-only preview
 * on XWFFlowCanvas) that opens in the editor as a draft. Suggestions, "start directly"
 * kinds and recommended templates are data from the studio API.
 *
 * Query: ?chat=<id> reopens a saved chat, ?soon=<id> explains a section outside the prototype.
 */
import { XWUITextarea, XWUICard } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { createKit } from '../../../core/ui.js';
import { template } from '../../../core/format.js';
import { STUDIO_LAYOUT_ID, STUDIO_ROUTES } from '../studio.routes.js';
import { XWFFlowCanvas } from '../../../components/XWFFlowCanvas/XWFFlowCanvas.js';

const PREVIEW_HEIGHT = 150;
const toneVar = (tone) => `var(--xw-${tone})`;

export default {
  id: 'studio-assistant',
  path: STUDIO_ROUTES.assistant,
  layout: STUDIO_LAYOUT_ID,
  async mount(el, ctx) {
    const { studioApi } = ctx.api;
    const page = pageSession(el, ctx);
    let previewKit = createKit();
    let recoKit = createKit();
    const [shell, catalog, assistant] = await Promise.all([studioApi.getShell(), studioApi.getCatalog(), studioApi.getAssistant()]);
    if (!page.active) return page.handle;
    const STUDIO_COPY = catalog.copy;
    ctx.setTitle(STUDIO_COPY.assistantTitle);
    const A = assistant.copy;
    const typeIndex = Object.fromEntries(catalog.nodeTypes.map((t) => [t.id, t]));
    const state = { text: '', draft: null, drafting: false, activeSuggestion: null, recommendedHidden: assistant.recommendedHidden };
    const assistantNav = shell.nav.primary.find((p) => p.id === 'assistant');

    ctx.layout?.setTopbar?.({ crumbs: [{ label: assistantNav?.label ?? '' }] });
    if (ctx.query.soon) {
      const item = shell.nav.footer.find((f) => f.id === ctx.query.soon);
      if (item) ctx.notify.info(template(A.notInPrototype, { name: item.label }));
    }

    /* ------------------------------ prompt */
    const { ui, scope } = page;
    const textareaHost = h('div', { class: 'assistant-prompt__input' });
    const textarea = scope.mountField(XWUITextarea, textareaHost, { placeholder: A.placeholder, rows: '3' }, { fullWidth: true, autoResize: true, resize: 'none', className: 'assistant-textarea' });
    const sendHost = h('span');
    const renderSend = () => sendHost.replaceChildren(ui.button(A.sendLabel, {
      variant: 'primary', icon: 'send', disabled: !state.text.trim() || state.drafting, loading: state.drafting, onClick: () => draft({ text: state.text }),
    }));
    textarea.onChange((v) => { state.text = v; renderSend(); });
    renderSend();

    const notReady = (name) => ctx.notify.info(template(A.notInPrototype, { name }));
    const prompt = h('div', { class: 'glass gb assistant-prompt' },
      h('label', { class: 'visually-hidden' }, A.placeholder),
      textareaHost,
      h('div', { class: 'rowf gap8 assistant-prompt__bar' },
        ui.button('', { variant: 'ghost', icon: 'paperclip', ariaLabel: A.attachLabel, title: A.attachLabel, onClick: () => notReady(A.attachLabel) }),
        ui.button('', { variant: 'ghost', icon: 'microphone', ariaLabel: A.speakLabel, title: A.speakLabel, onClick: () => notReady(A.speakLabel) }),
        ui.tag(shell.project.name, 'default', { className: 'xw-tone-violet' }),
        h('span', { class: 'xs ter sp' }, A.focusHint),
        sendHost));

    /* ------------------------------ suggestions */
    const pills = h('div', { class: 'wrapf gap8 assistant-pills' });
    const renderPills = () => pills.replaceChildren(
      ...A.suggestions.map((s) => ui.button(s.label, {
        variant: state.activeSuggestion === s.id ? 'primary' : 'secondary', size: 'sm',
        onClick: () => { state.activeSuggestion = s.id; renderPills(); textarea.setValue(s.label); state.text = s.label; renderSend(); draft({ text: s.label, templateId: s.templateId }); },
      })),
      ui.button(A.seeAll, { variant: 'ghost', size: 'sm', onClick: () => document.getElementById('assistant-recommended')?.scrollIntoView({ behavior: 'smooth' }) }));
    renderPills();

    /* ------------------------------ preview */
    const previewHost = h('div', { class: 'glass assistant-preview' });
    function renderPreview() {
      previewKit.scope.destroy();
      previewKit = createKit();
      const { ui: pui, scope: pscope } = previewKit;
      if (state.drafting) {
        previewHost.replaceChildren(h('div', { class: 'rowf gap8 assistant-preview__head' }, h('b', {}, A.previewTitle), pui.tag(A.draftingLabel, 'default', { className: 'xw-tone-cyan' })),
          pui.skeleton({ variant: 'rounded', height: `${PREVIEW_HEIGHT}px` }));
        return;
      }
      if (!state.draft) { previewHost.replaceChildren(); previewHost.hidden = true; return; }
      previewHost.hidden = false;
      const canvasHost = h('div', { class: 'assistant-preview__canvas', style: { height: `${PREVIEW_HEIGHT}px` } });
      const needsConnection = state.draft.graph.nodes.filter((n) => n.needsConnection).length;
      previewHost.replaceChildren(
        h('div', { class: 'rowf gap8 wrapf assistant-preview__head' },
          h('b', {}, A.previewTitle), pui.tag(A.flowTag, 'primary'),
          h('span', { class: 'small sec' }, state.draft.request || state.draft.name),
          pui.tag(A.previewDraftTag, 'default', { className: 'xw-tone-plan sp' })),
        canvasHost,
        h('div', { class: 'rowf gap8 assistant-preview__foot' },
          needsConnection ? h('span', { class: 'xs', style: { color: 'var(--xw-amber)' } }, `${needsConnection} ${A.needsConnection.toLowerCase()}`) : null,
          pui.button(A.openDraftLabel, { variant: 'primary', size: 'sm', icon: 'arrow-right', iconPosition: 'right', className: 'sp', onClick: openDraft })));
      pscope.mount(XWFFlowCanvas, canvasHost, {
        graph: state.draft.graph, nodeTypes: typeIndex, nodeStates: {}, portLabels: STUDIO_COPY.editor.ports, labels: STUDIO_COPY.editor.tools,
      }, { readOnly: true, showMinimap: false, showTools: false, nodeWidth: 210 });
      canvasHost.querySelectorAll('.xwf-node__warn').forEach((n) => { n.textContent = A.needsConnection; });
    }

    async function draft({ text = '', templateId = null }) {
      state.drafting = true;
      renderSend();
      renderPreview();
      try {
        state.draft = await studioApi.draftFromPrompt({ text, templateId });
        if (!state.draft.request) state.draft.request = text;
      } catch (error) {
        ctx.notify.fromError(error);
      } finally {
        state.drafting = false;
        renderSend();
        renderPreview();
      }
    }

    async function openDraft() {
      if (state.draft.flowId) { ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: state.draft.flowId }).slice(1)); return; }
      try {
        const { id } = await studioApi.createFlow({ templateId: state.draft.template.id, name: state.draft.name });
        ctx.navigate(ctx.href(STUDIO_ROUTES.editor, { flowId: id }).slice(1));
      } catch (error) { ctx.notify.fromError(error); }
    }

    /* ------------------------------ start directly */
    const kinds = h('div', { class: 'assistant-kinds' }, A.startKinds.map((k) => ui.mount(XWUICard, {
      body: h('div', { class: 'stack gap12' }, h('span', { class: 'ico s', style: { '--gc': toneVar(k.tone) } }, ui.icon(k.icon, { size: 'sm' })), h('b', {}, k.label), h('span', { class: 'xs sec' }, k.hint)),
    }, { padding: 'none', clickable: true, ariaLabel: `${k.label} ${k.hint}`, onClick: () => k.route ? ctx.navigate(k.route) : notReady(k.label) }, { className: 'mk assistant-kind studio-card' })));

    /* ------------------------------ recommended */
    const recoBody = h('div');
    const recoHead = h('div', { class: 'rowf gap8' }, h('h2', { class: 'h3' }, A.recommendedTitle));
    function renderReco() {
      recoKit.scope.destroy();
      recoKit = createKit();
      recoHead.querySelector('.assistant-reco__toggle')?.remove();
      const toggle = recoKit.ui.button(state.recommendedHidden ? A.showLabel : A.hideLabel, {
        variant: 'ghost', size: 'sm', className: 'sp assistant-reco__toggle', ariaLabel: state.recommendedHidden ? A.showLabel : A.hideLabel,
        onClick: async () => {
          state.recommendedHidden = !state.recommendedHidden;
          renderReco();
          try { await studioApi.setRecommendedHidden(state.recommendedHidden); } catch (error) { ctx.notify.fromError(error); }
        },
      });
      toggle.querySelector('button')?.setAttribute('aria-expanded', String(!state.recommendedHidden));
      recoHead.append(toggle);
      recoBody.replaceChildren(state.recommendedHidden ? '' : h('div', { class: 'g3 assistant-reco' }, assistant.recommended.map((t) => recoKit.ui.mount(XWUICard, { body: h('div', { class: 'stack gap12' },
      t.top && recoKit.ui.tag(A.topRecommendation, 'default', { className: 'xw-tone-violet' }),
      h('b', {}, t.name),
      !t.top && h('span', { class: 'small sec' }, t.steps.map((s) => s.name).join(', ')),
      h('div', { class: 'rowf gap4' },
        t.steps.map((s) => h('span', { class: 'ico s assistant-reco__dot', style: { '--gc': toneVar(typeIndex[s.type]?.tone) } })),
        h('span', { class: 'xs sec sp' }, template(t.connectionsNeeded ? A.stepsToConnect : A.stepsCount, { n: t.steps.length, c: t.connectionsNeeded })))) }, {
          padding: 'none', clickable: true, ariaLabel: t.name,
          onClick: () => { textarea.setValue(t.name); state.text = t.name; renderSend(); draft({ text: t.name, templateId: t.id }); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        }, { className: `mk assistant-reco__card studio-card${t.top ? ' gb' : ''}` }))));
    }
    renderReco();

    el.replaceChildren(h('div', { class: 'pg assistant' },
      h('div', { class: 'halo', style: { left: '30%', top: '60px', width: '460px', height: '320px', background: 'var(--xw-violet)' } }),
      h('div', { class: 'halo', style: { right: '10%', top: '260px', width: '300px', height: '300px', background: 'var(--xw-pink)', opacity: '.3' } }),
      h('div', { class: 'stack gap24 assistant__col' },
        h('div', { class: 'assistant-core', 'aria-hidden': 'true' },
          h('div', { class: 'orb', style: { '--oc': 'var(--xw-violet)', width: '120px', height: '120px', left: '40px', top: '40px' } }),
          h('div', { class: 'assistant-core__ring1' }, h('div', { class: 'ring', style: { '--rw': '4px', width: '200px', height: '200px', left: '0', top: '0' } })),
          h('div', { class: 'assistant-core__ring2' }, h('div', { class: 'ring', style: { '--rw': '3px', width: '170px', height: '170px', left: '0', top: '0', animationDuration: '12s' } }))),
        h('div', { class: 'stack gap8 center' },
          h('h1', { class: 'h2' }, A.title.before, h('span', { class: 'grad-text' }, A.title.accent), A.title.after),
          h('p', { class: 'sec' }, A.subtitle)),
        prompt, pills, previewHost,
        h('div', { class: 'stack gap12' }, h('h2', { class: 'h3' }, A.startTitle), kinds),
        h('div', { class: 'stack gap12', id: 'assistant-recommended' }, recoHead, recoBody))));

    // Ctrl I focuses the prompt
    scope.listen(window, 'keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); textarea.focus?.(); }
    });

    // a chat from the rail reopens its flow as the preview
    const chat = ctx.query.chat ? shell.chats.find((c) => c.id === ctx.query.chat) : null;
    if (chat) {
      const flow = await studioApi.getFlow(chat.flowId);
      textarea.setValue(chat.title);
      state.text = chat.title;
      state.draft = { name: flow.name, request: chat.title, graph: flow.graph, template: { id: null }, flowId: flow.id };
      renderSend();
      renderPreview();
    } else {
      await draft({ templateId: A.suggestions[0].templateId, text: A.suggestions[0].label });
      state.activeSuggestion = A.suggestions[0].id;
      renderPills();
    }

    return {
      unmount() {
        previewKit.scope.destroy();
        recoKit.scope.destroy();
        page.scope.destroy();
      },
    };
  },
};
