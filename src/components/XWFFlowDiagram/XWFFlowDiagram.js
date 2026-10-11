/**
 * XWFFlowDiagram - component. One flow, many notations, all generated from the same graph
 * and receipt. XWUI basic has no diagramming component (XWUIDiagram is licensed), so the
 * notations are drawn here on the XWUI base; XWUIIcon renders step glyphs in 3D.
 */
import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../core/dom.js';
import { createKit } from '../../core/ui.js';
import { XWF_FLOW_DIAGRAM_EVENTS as EV } from './XWFFlowDiagram.model.js';
import { createXWFFlowDiagramLogic, deriveSystems, createSimState, stepSim, simModel, simSummary } from './XWFFlowDiagram.logic.js';
import { projectXWFFlowDiagramView } from './XWFFlowDiagram.view.js';

ensureStylesheet('xwf-css-xwfflowdiagram', new URL('./XWFFlowDiagram.css', import.meta.url));

let uidCounter = 0;
/** Simulated minutes per animation tick at 1x speed, and the tick length. */
const SIM_MINUTES_PER_TICK = 2;
const SIM_TICK_MS = 300;

export class XWFFlowDiagram extends XWUIComponent {
  static componentName = 'XWFFlowDiagram';

  /**
   * @param {HTMLElement} container
   * @param {{ flow: object, nodeTypes: Record<string, object>, run?: object, connections?: object[], lanes?: object[], labels: object }} data
   * @param {{ notation?: string, thumbnail?: boolean, animate?: boolean, tilt?: number, spin?: number, height?: number, className?: string }} conf_comp
   */
  constructor(container, data = {}, conf_comp = {}) {
    super(container, createXWFFlowDiagramLogic(data, conf_comp));
    this.uidKey = `d${++uidCounter}`;
    this.kit = null;
    this.simTimer = null;
    this.simSpeed = 1;
    if (this.config.notation === 'sim') this.resetSim();
    this.unsubscribe = this.logic.subscribe(() => this.renderView());
    this.renderView();
    if (this.config.notation === 'sim' && this.config.animate && !this.config.thumbnail) this.playSim();
    if (this.config.notation === '3d' && !this.config.thumbnail) this.bindOrbit();
  }

  renderView() {
    this.kit?.scope.destroy();
    this.kit = createKit(this);
    const { nodeTypes, run, connections, labels, simState, lanes } = this.data;
    const { notation, thumbnail, animate, tilt, spin, height } = this.config;
    const flow = notation === 'sim' ? this.simFlow() : this.data.flow;
    const systemsModel = deriveSystems(flow, nodeTypes, connections ?? [], lanes ?? []);
    const view = projectXWFFlowDiagramView(notation, {
      flow, types: nodeTypes, run, labels, uid: this.uidKey, thumbnail, animate, systemsModel, simState,
      ui: this.kit.ui, tilt, spin, height,
      onLedger: (index) => this.container.dispatchEvent(new CustomEvent(EV.LEDGER, { bubbles: true, detail: { index } })),
    });
    this.systemsModel = systemsModel;
    this.lastView = view;
    this.container.replaceChildren(h('div', {
      class: ['xwf-diagram', `xwf-diagram--${notation}`, { 'is-thumbnail': thumbnail, 'is-zoomed': this.config.zoom !== 1 }, this.config.className],
      style: { '--xwf-zoom': String(this.config.zoom) },
    }, view));
  }

  /* ------------------------------ facts for page chrome */

  getSystems() { return this.systemsModel?.systems ?? []; }

  getHandoffs() { return Number(this.lastView?.dataset?.handoffs ?? 0); }

  /** The rendered SVG as a standalone file (for Export). */
  toSvgString() {
    const svg = this.container.querySelector('svg.xwf-diagram__svg');
    if (!svg) return null;
    const copy = svg.cloneNode(true);
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const css = getComputedStyle(document.documentElement);
    const resolved = copy.outerHTML.replace(/var\((--[\w-]+)\)/g, (_, v) => css.getPropertyValue(v).trim() || '#888');
    return `<?xml version="1.0" encoding="UTF-8"?>\n${resolved}`;
  }

  /** Draw the notation from another receipt (sequence, swimlane retries, 3D heights). */
  setRun(run) { this.logic.updateData({ run }); }

  /* ------------------------------ zoom (2D notations) */

  getZoom() { return this.config.zoom; }

  /** Multiply the zoom, clamped to minZoom..maxZoom; 0 or no factor resets to fit. */
  zoomBy(factor) {
    const { zoom, minZoom, maxZoom } = this.config;
    const next = factor ? Math.min(maxZoom, Math.max(minZoom, Math.round(zoom * factor * 100) / 100)) : 1;
    if (next !== zoom) this.logic.updateConfig({ zoom: next });
    return next;
  }

  resetZoom() { return this.zoomBy(0); }

  /* ------------------------------ simulation */

  /** The flow as the simulation sees it: the model with the current scenario applied. */
  simFlow() { return simModel(this.data.flow, this.data.scenario ?? {}); }

  /** Change the what-if (arrivals, service time, workers) and start the model over. */
  setScenario(patch) {
    this.logic.updateData({ scenario: { ...(this.data.scenario ?? {}), ...patch } });
    this.resetSim();
  }

  getSimSummary() { return simSummary(this.data.simState, this.simFlow(), this.data.nodeTypes); }

  resetSim() {
    this.logic.updateData({ simState: createSimState(this.data.flow, this.data.nodeTypes) });
    this.container.dispatchEvent(new CustomEvent(EV.STEP, { bubbles: true, detail: { state: this.data.simState } }));
  }

  stepSimOnce(minutes = SIM_MINUTES_PER_TICK * this.simSpeed) {
    const next = stepSim(this.data.simState ?? createSimState(this.data.flow, this.data.nodeTypes), this.simFlow(), this.data.nodeTypes, minutes);
    this.logic.updateData({ simState: next });
    this.container.dispatchEvent(new CustomEvent(EV.STEP, { bubbles: true, detail: { state: next } }));
    if (!next.running) this.pauseSim();
    return next;
  }

  playSim() {
    if (this.simTimer) return;
    if (!this.data.simState?.running) this.resetSim();
    this.simTimer = setInterval(() => this.stepSimOnce(), SIM_TICK_MS);
  }

  pauseSim() {
    clearInterval(this.simTimer);
    this.simTimer = null;
  }

  isSimPlaying() { return Boolean(this.simTimer); }

  setSimSpeed(speed) { this.simSpeed = speed; }

  /* ------------------------------ 3D orbit */

  bindOrbit() {
    let drag = null;
    this.onOrbitDown = (e) => {
      if (!e.target.closest('.xwf-3d__stage')) return;
      drag = { x: e.clientX, y: e.clientY, tilt: this.config.tilt, spin: this.config.spin };
    };
    this.onOrbitMove = (e) => {
      if (!drag) return;
      const spin = drag.spin + (e.clientX - drag.x) * 0.25;
      const tilt = Math.max(10, Math.min(80, drag.tilt - (e.clientY - drag.y) * 0.2));
      const plane = this.container.querySelector('.xwf-3d__plane');
      if (plane) plane.style.transform = `rotateX(${tilt}deg) rotateZ(${spin}deg)`;
      drag.next = { tilt, spin };
    };
    this.onOrbitUp = () => {
      if (drag?.next) this.logic.updateConfig(drag.next);
      drag = null;
    };
    this.container.addEventListener('pointerdown', this.onOrbitDown);
    window.addEventListener('pointermove', this.onOrbitMove);
    window.addEventListener('pointerup', this.onOrbitUp);
  }

  setView({ tilt, spin, height }) {
    this.logic.updateConfig({ ...(tilt !== undefined && { tilt }), ...(spin !== undefined && { spin }), ...(height !== undefined && { height }) });
  }

  destroy() {
    this.pauseSim();
    this.unsubscribe?.();
    this.kit?.scope.destroy();
    if (this.onOrbitDown) {
      this.container.removeEventListener('pointerdown', this.onOrbitDown);
      window.removeEventListener('pointermove', this.onOrbitMove);
      window.removeEventListener('pointerup', this.onOrbitUp);
    }
    super.destroy();
  }
}

createXWUIElement(XWFFlowDiagram, 'xwf-flow-diagram');
