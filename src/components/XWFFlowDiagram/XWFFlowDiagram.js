/**
 * XWFFlowDiagram - component. One flow, many notations, all generated from the same graph
 * and receipt. XWUI basic has no diagramming component (XWUIDiagram is licensed), so the
 * notations are drawn here on the XWUI base; XWUIIcon renders step glyphs in 3D.
 */
import { XWUIComponent, createXWUIElement } from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../core/dom.js';
import { createKit } from '../../core/ui.js';
import { XWF_FLOW_DIAGRAM_EVENTS as EV, DIAGRAM_TIMING, DIAGRAM_GEOMETRY as G } from './XWFFlowDiagram.model.js';
import { createXWFFlowDiagramLogic, deriveSystems, createSimState, stepSim } from './XWFFlowDiagram.logic.js';
import { serializeSvg } from './renderers/svg.js';
import { projectXWFFlowDiagramView } from './XWFFlowDiagram.view.js';

ensureStylesheet('xwf-css-xwfflowdiagram', new URL('./XWFFlowDiagram.css', import.meta.url));

let uidCounter = 0;
/** Simulated minutes per animation tick at 1x speed, and the tick length. */
const SIM_MINUTES_PER_TICK = DIAGRAM_TIMING.minutesPerTick;
const SIM_TICK_MS = DIAGRAM_TIMING.tickMs;

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
    const { flow, nodeTypes, run, connections, labels, simState, lanes } = this.data;
    const { notation, thumbnail, animate, tilt, spin, height } = this.config;
    const systemsModel = deriveSystems(flow, nodeTypes, connections ?? [], lanes ?? []);
    const view = projectXWFFlowDiagramView(notation, {
      flow, types: nodeTypes, run, labels, uid: this.uidKey, thumbnail, animate: animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches, systemsModel, simState,
      ui: this.kit.ui, tilt, spin, height,
      onLedger: (index) => this.container.dispatchEvent(new CustomEvent(EV.LEDGER, { bubbles: true, detail: { index } })),
    });
    this.systemsModel = systemsModel;
    this.lastView = view;
    this.container.replaceChildren(h('div', { class: ['xwf-diagram', `xwf-diagram--${notation}`, { 'is-thumbnail': thumbnail }, this.config.className] }, view));
  }

  /* ------------------------------ facts for page chrome */

  getSystems() { return this.systemsModel?.systems ?? []; }

  getHandoffs() { return Number(this.lastView?.dataset?.handoffs ?? 0); }

  /** The rendered SVG as a standalone file (for Export). */
  toSvgString() {
    const svg = this.container.querySelector('svg.xwf-diagram__svg');
    if (!svg) return null;
    return serializeSvg(svg);
  }

  /* ------------------------------ simulation */

  resetSim() {
    this.logic.updateData({ simState: createSimState(this.data.flow, this.data.nodeTypes) });
  }

  stepSimOnce(minutes = SIM_MINUTES_PER_TICK * this.simSpeed) {
    const next = stepSim(this.data.simState ?? createSimState(this.data.flow, this.data.nodeTypes), this.data.flow, this.data.nodeTypes, minutes);
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
      const spin = drag.spin + (e.clientX - drag.x) * G.orbit.spinFactor;
      const tilt = Math.max(G.orbit.minTilt, Math.min(G.orbit.maxTilt, drag.tilt - (e.clientY - drag.y) * G.orbit.tiltFactor));
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
