/**
 * XWFFlowCanvas - component.
 * XWUI basic has no graph editor (XWUIDiagram ships in the licensed super tier), so the
 * flow canvas is built on the XWUI base: XWUIComponentLogic holds graph + selection,
 * XWUIButton/XWUIIcon/XWUIDisplayTag render the chrome, XWFStatus the node states.
 *
 * Interactions: select (click), move (drag a node), pan (drag the background), zoom
 * (wheel, tools), connect (drag from an output pin onto a step), delete (Delete key),
 * nudge (arrow keys), rename (double click -> xwf-activate), drop a palette step.
 */
import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../core/dom.js';
import { createKit } from '../../core/ui.js';
import { XWFStatus } from '../XWFStatus/XWFStatus.js';
import {
  XWF_FLOW_CANVAS_EVENTS as EV, XWF_NODE_GEOMETRY as G, XWF_FLOW_DND_TYPE,
} from './XWFFlowCanvas.model.js';
import {
  createXWFFlowCanvasLogic, edgeGeometry, graphBounds, fitTransform, zoomAround, screenToWorld,
  moveNode, removeNode, removeEdge, connect, tidyLayout, minimapModel, outPortPoint, edgePath,
} from './XWFFlowCanvas.logic.js';
import { projectXWFFlowCanvasView, projectXWFFlowMinimap } from './XWFFlowCanvas.view.js';

ensureStylesheet('xwf-css-xwfflowcanvas', new URL('./XWFFlowCanvas.css', import.meta.url));

let uidCounter = 0;
const DRAG_THRESHOLD = 3;
const FIT_PADDING = 24;

export class XWFFlowCanvas extends XWUIComponent {
  static componentName = 'XWFFlowCanvas';

  /**
   * @param {HTMLElement} container
   * @param {{ graph: import('./XWFFlowCanvas.model.js').XWFFlowGraph, nodeTypes: Record<string, object>,
   *   nodeStates?: Record<string, { label: string, kind: string }>, selectedId?: string,
   *   portLabels?: { yes: string, no: string }, labels?: object }} data
   * @param {object} conf_comp see XWF_FLOW_CANVAS_DEFINITION
   */
  constructor(container, data = {}, conf_comp = {}) {
    super(container, createXWFFlowCanvasLogic(data, conf_comp));
    this.uidKey = `c${++uidCounter}`;
    this.transform = { x: 0, y: 0, k: 1 };
    this.kit = null;
    this.refs = null;
    this.gesture = null;

    this.root = h('div', { class: ['xwf-flow-canvas', 'cv', this.config.className], tabindex: '0', 'aria-label': this.data.labels?.canvas ?? '' });
    this.layer = h('div', { class: 'xwf-flow-canvas__layer' });
    this.overlay = h('div', { class: 'xwf-flow-canvas__overlay' });
    this.root.append(this.layer, this.overlay);
    this.container.replaceChildren(this.root);

    this.bindEvents();
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
    requestAnimationFrame(() => this.fit({ animate: false }));
  }

  /* ------------------------------------------------------------ render */

  get width() { return this.config.nodeWidth; }

  renderView() {
    this.kit?.scope.destroy();
    this.kit = createKit(this);
    const { graph, nodeTypes, nodeStates, selectedId, portLabels, labels } = this.data;
    const statusEl = (label, kind) => {
      const host = h('span', { class: 'xw-host xwf-node__status' });
      this.kit.scope.mount(XWFStatus, host, { label }, { kind, size: 'sm' });
      return host;
    };
    this.refs = projectXWFFlowCanvasView(
      { graph, types: nodeTypes, states: nodeStates, selectedId, width: this.width, readOnly: this.config.readOnly, portLabels, labels },
      { ui: this.kit.ui, statusEl, uid: this.uidKey },
    );
    this.layer.replaceChildren(this.refs.world, this.refs.empty || '');
    this.applyTransform();
    this.renderOverlay();
  }

  renderOverlay() {
    const { showTools, showMinimap, safeArea } = this.config;
    const labels = this.data.labels ?? {};
    const parts = [];
    if (showTools) {
      const tools = [
        ['zoomOut', 'zoom-out', () => this.zoomBy(1 / (1 + this.config.zoomStep))],
        ['zoomIn', 'zoom-in', () => this.zoomBy(1 + this.config.zoomStep)],
        ['fit', 'maximize', () => this.fit()],
        ...(this.config.readOnly ? [] : [['tidy', 'layout-grid', () => this.tidy()]]),
      ];
      parts.push(h('div', { class: 'cvtools xwf-flow-canvas__tools', style: { left: `${safeArea.left + 14}px`, bottom: `${safeArea.bottom + 20}px` }, role: 'toolbar', 'aria-label': labels.tools },
        tools.map(([key, icon, onClick]) => this.kit.ui.button('', { variant: 'ghost', size: 'sm', icon, title: labels[key], ariaLabel: labels[key], onClick }))));
    }
    if (showMinimap && this.data.graph.nodes.length) {
      const box = G.minimap;
      const vp = this.viewportRect();
      const mini = minimapModel(this.data.graph, this.data.nodeTypes, this.width, this.transform, vp, box);
      const el = projectXWFFlowMinimap(mini, { selectedId: this.data.selectedId, labels, box });
      el.style.right = `${safeArea.right + 16}px`;
      el.style.bottom = `${safeArea.bottom + 20}px`;
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const r = el.getBoundingClientRect();
        const world = mini.toWorld(e.clientX - r.left, e.clientY - r.top);
        this.centerOn(world);
      });
      parts.push(el);
    }
    this.overlay.replaceChildren(...parts);
  }

  applyTransform() {
    const { x, y, k } = this.transform;
    if (this.refs) this.refs.world.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    this.root.style.backgroundPosition = `${x}px ${y}px`;
    this.root.style.backgroundSize = `${this.config.gridSize * k}px ${this.config.gridSize * k}px`;
  }

  /** Update node and edge positions in place (used while dragging). */
  patchGeometry(graph) {
    graph.nodes.forEach((n) => {
      const el = this.refs.nodeRefs.get(n.id);
      if (el) { el.style.left = `${n.x}px`; el.style.top = `${n.y}px`; }
    });
    edgeGeometry(graph, this.data.nodeTypes, this.width).forEach((e) => {
      this.refs.edgeRefs.get(e.id)?.forEach((p) => p.setAttribute('d', e.d));
      const grad = this.refs.svg.querySelector(`#xwf-eg-${this.uidKey}-${e.id}`);
      grad?.setAttribute('x1', e.a.x); grad?.setAttribute('y1', e.a.y); grad?.setAttribute('x2', e.b.x); grad?.setAttribute('y2', e.b.y);
      const label = this.refs.world.querySelector(`[data-edge-label="${e.id}"]`);
      if (label) { label.style.left = `${e.labelAt.x}px`; label.style.top = `${e.port === 'no' ? e.a.y + 6 : e.labelAt.y - 10}px`; }
    });
  }

  /* ------------------------------------------------------------ viewport */

  viewportRect() {
    const s = this.config.safeArea;
    return { x: s.left, y: s.top, w: Math.max(200, this.root.clientWidth - s.left - s.right), h: Math.max(160, this.root.clientHeight - s.top - s.bottom) };
  }

  setTransform(next) {
    this.transform = next;
    this.applyTransform();
    if (this.config.showMinimap) this.renderOverlayMinimapOnly();
    this.root.dispatchEvent(new CustomEvent(EV.VIEWPORT, { detail: { ...next } }));
  }

  renderOverlayMinimapOnly() {
    const view = this.overlay.querySelector('.xwf-minimap__view');
    if (!view) return;
    const mini = minimapModel(this.data.graph, this.data.nodeTypes, this.width, this.transform, this.viewportRect(), G.minimap);
    Object.assign(view.style, { left: `${mini.view.x}px`, top: `${mini.view.y}px`, width: `${mini.view.w}px`, height: `${mini.view.h}px` });
  }

  fit() {
    const bounds = graphBounds(this.data.graph, this.data.nodeTypes, this.width);
    this.setTransform(fitTransform(bounds, this.viewportRect(), { padding: FIT_PADDING, min: this.config.minZoom, max: 1 }));
  }

  zoomBy(factor, point = null) {
    const vp = this.viewportRect();
    const p = point ?? { x: vp.x + vp.w / 2, y: vp.y + vp.h / 2 };
    this.setTransform(zoomAround(this.transform, factor, p, this.config.minZoom, this.config.maxZoom));
  }

  centerOn(world) {
    const vp = this.viewportRect();
    const { k } = this.transform;
    this.setTransform({ k, x: vp.x + vp.w / 2 - world.x * k, y: vp.y + vp.h / 2 - world.y * k });
  }

  /* ------------------------------------------------------------ edits */

  emitChange(graph, reason) {
    this.logic.updateData({ graph });
    this.root.dispatchEvent(new CustomEvent(EV.CHANGE, { bubbles: true, detail: { graph, reason } }));
  }

  select(id) {
    if (this.data.selectedId === id) return;
    this.logic.updateData({ selectedId: id });
    const node = this.data.graph.nodes.find((n) => n.id === id) ?? null;
    const edge = node ? null : this.data.graph.edges.find((e) => e.id === id) ?? null;
    this.root.dispatchEvent(new CustomEvent(EV.SELECT, { bubbles: true, detail: { id, node, edge } }));
  }

  tidy() {
    this.emitChange(tidyLayout(this.data.graph, this.data.nodeTypes, this.config.tidyGap), 'tidy');
    requestAnimationFrame(() => this.fit());
  }

  deleteSelection() {
    const id = this.data.selectedId;
    if (!id || this.config.readOnly) return;
    const graph = this.data.graph.nodes.some((n) => n.id === id) ? removeNode(this.data.graph, id) : removeEdge(this.data.graph, id);
    this.logic.updateData({ selectedId: '' });
    this.emitChange(graph, 'delete');
    this.root.dispatchEvent(new CustomEvent(EV.SELECT, { bubbles: true, detail: { id: '', node: null, edge: null } }));
  }

  /* ------------------------------------------------------------ events */

  localPoint(e) {
    const r = this.root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  bindEvents() {
    const root = this.root;
    this.onPointerDown = (e) => {
      if (e.button !== 0 || e.target.closest('.cvtools, .xwf-minimap')) return;
      root.focus({ preventScroll: true });
      const point = this.localPoint(e);
      const pin = e.target.closest('.xwf-node__out');
      const nodeEl = e.target.closest('[data-node-id]');
      const edgeEl = e.target.closest('.xwf-edge__hit');
      if (pin && !this.config.readOnly) {
        this.gesture = { kind: 'connect', from: pin.dataset.nodeId, port: pin.dataset.port, start: point };
      } else if (nodeEl) {
        const node = this.data.graph.nodes.find((n) => n.id === nodeEl.dataset.nodeId);
        this.select(node.id);
        this.gesture = { kind: 'move', id: node.id, start: point, origin: { x: node.x, y: node.y }, moved: false, graph: this.data.graph };
      } else if (edgeEl) {
        this.select(edgeEl.dataset.edgeId);
        return;
      } else {
        this.gesture = { kind: 'pan', start: point, origin: { ...this.transform }, moved: false };
      }
      root.setPointerCapture(e.pointerId);
    };

    this.onPointerMove = (e) => {
      const g = this.gesture;
      if (!g) return;
      const point = this.localPoint(e);
      const dx = point.x - g.start.x;
      const dy = point.y - g.start.y;
      if (!g.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      g.moved = true;
      if (g.kind === 'pan') {
        this.setTransform({ ...g.origin, x: g.origin.x + dx, y: g.origin.y + dy });
      } else if (g.kind === 'move' && !this.config.readOnly) {
        const k = this.transform.k;
        g.graph = moveNode(this.data.graph, g.id, g.origin.x + dx / k, g.origin.y + dy / k);
        this.patchGeometry(g.graph);
      } else if (g.kind === 'connect') {
        const from = this.data.graph.nodes.find((n) => n.id === g.from);
        const a = outPortPoint(from, this.data.nodeTypes[from.type], g.port, this.width);
        const b = screenToWorld(this.transform, point);
        this.refs.svg.querySelector('[data-draft]').setAttribute('d', edgePath(a, b));
      }
    };

    this.onPointerUp = (e) => {
      const g = this.gesture;
      this.gesture = null;
      if (!g) return;
      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
      if (g.kind === 'pan' && !g.moved) this.select('');
      if (g.kind === 'move' && g.moved && !this.config.readOnly) this.emitChange(g.graph, 'move');
      if (g.kind === 'connect') {
        this.refs.svg.querySelector('[data-draft]')?.setAttribute('d', '');
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-node-id]');
        if (target) {
          const result = connect(this.data.graph, g.from, g.port, target.dataset.nodeId, this.data.nodeTypes);
          if (result.ok) this.emitChange(result.graph, 'connect');
        }
      }
    };

    this.onWheel = (e) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      this.zoomBy(factor, this.localPoint(e));
    };

    this.onDblClick = (e) => {
      const nodeEl = e.target.closest('[data-node-id]');
      if (nodeEl && !this.config.readOnly) root.dispatchEvent(new CustomEvent(EV.ACTIVATE, { bubbles: true, detail: { id: nodeEl.dataset.nodeId } }));
    };

    this.onKeyDown = (e) => {
      if (e.target !== root) return;
      const id = this.data.selectedId;
      if ((e.key === 'Delete' || e.key === 'Backspace') && id) { e.preventDefault(); this.deleteSelection(); }
      const step = e.shiftKey ? 40 : 10;
      const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const node = this.data.graph.nodes.find((n) => n.id === id);
      if (arrows[e.key] && node && !this.config.readOnly) {
        e.preventDefault();
        const [dx, dy] = arrows[e.key];
        this.emitChange(moveNode(this.data.graph, id, node.x + dx, node.y + dy), 'move');
      }
      if (e.key === 'Escape') this.select('');
    };

    this.onDragOver = (e) => {
      if (this.config.readOnly || !e.dataTransfer?.types.includes(XWF_FLOW_DND_TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };
    this.onDrop = (e) => {
      const type = e.dataTransfer?.getData(XWF_FLOW_DND_TYPE);
      if (!type) return;
      e.preventDefault();
      const world = screenToWorld(this.transform, this.localPoint(e));
      root.dispatchEvent(new CustomEvent(EV.DROP_TYPE, { bubbles: true, detail: { type, x: world.x - this.width / 2, y: world.y - G.portY } }));
    };

    root.addEventListener('pointerdown', this.onPointerDown);
    root.addEventListener('pointermove', this.onPointerMove);
    root.addEventListener('pointerup', this.onPointerUp);
    root.addEventListener('pointercancel', this.onPointerUp);
    root.addEventListener('wheel', this.onWheel, { passive: false });
    root.addEventListener('dblclick', this.onDblClick);
    root.addEventListener('keydown', this.onKeyDown);
    root.addEventListener('dragover', this.onDragOver);
    root.addEventListener('drop', this.onDrop);
  }

  /* ------------------------------------------------------------ public API */

  setGraph(graph) { this.logic.updateData({ graph }); }

  setNodeStates(nodeStates) { this.logic.updateData({ nodeStates }); }

  setSelected(id) { this.logic.updateData({ selectedId: id }); }

  /** Area covered by floating panels; tools, minimap and fit() keep clear of it. */
  setSafeArea(safeArea) {
    const current = this.config.safeArea;
    if (['left', 'right', 'top', 'bottom'].every((side) => current[side] === safeArea[side])) return;
    this.logic.updateConfig({ safeArea: { ...safeArea } });
  }

  getGraph() { return this.data.graph; }

  getTransform() { return { ...this.transform }; }

  focusNode(id) {
    const node = this.data.graph.nodes.find((n) => n.id === id);
    if (node) this.centerOn({ x: node.x + this.width / 2, y: node.y + G.portY });
  }

  destroy() {
    this.unsubscribe?.();
    this.kit?.scope.destroy();
    const root = this.root;
    root.removeEventListener('pointerdown', this.onPointerDown);
    root.removeEventListener('pointermove', this.onPointerMove);
    root.removeEventListener('pointerup', this.onPointerUp);
    root.removeEventListener('pointercancel', this.onPointerUp);
    root.removeEventListener('wheel', this.onWheel);
    root.removeEventListener('dblclick', this.onDblClick);
    root.removeEventListener('keydown', this.onKeyDown);
    root.removeEventListener('dragover', this.onDragOver);
    root.removeEventListener('drop', this.onDrop);
    super.destroy();
  }
}

createXWUIElement(XWFFlowCanvas, 'xwf-flow-canvas');
