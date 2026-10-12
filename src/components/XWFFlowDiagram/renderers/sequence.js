/**
 * UML sequence diagram built from a run receipt: lifelines per system, calls and replies
 * (failed replies red), waits as self-messages, an `alt` fragment for each condition, and
 * numbered receipt dots that link back to ledger rows.
 */
import { h } from '../../../core/dom.js';
import { deriveSequence } from '../XWFFlowDiagram.logic.js';
import { defs, marker, svgRoot, MUTED } from './svg.js';

const LANE_GAP = 250;
const HEAD = { w: 180, h: 54 };
const ROW = 46;

const toneVar = (tone) => `var(--xw-${tone})`;
const DOT_TONES = ['lime', 'red', 'cyan', 'orange', 'pink', 'violet', 'amber', 'green'];

export function renderSequence({ flow, types, run, labels, uid, systemsModel, onLedger }) {
  const { systems } = systemsModel;
  const { messages, fragments } = deriveSequence(flow, types, run, systemsModel, labels);
  const x = new Map(systems.map((s, i) => [s.id, 200 + i * LANE_GAP]));
  const width = 200 + (systems.length - 1) * LANE_GAP + 160;
  const top = 140;
  // y of every row: self-messages need room for their loop, fragments for their header
  const ys = [];
  let cursor = top;
  messages.forEach((m, i) => {
    if (fragments.some((f) => f.from === i)) cursor += 44;
    if (fragments.some((f) => f.elseAt === i)) cursor += 26;
    ys.push(cursor);
    cursor += ROW + (m.kind === 'self' || m.kind === 'wait' ? 30 : 0);
    if (fragments.some((f) => f.to === i)) cursor += 20;
  });
  const rowY = (i) => ys[i] ?? cursor;
  const bottom = cursor + 20;
  const height = bottom + 20;

  const out = [];
  out.push(h('rect', { x: 20, y: 88, width: 70, height: bottom - 88, rx: 14, fill: 'rgba(255,255,255,.025)' }),
    h('text', { x: 55, y: 110, 'text-anchor': 'middle', 'font-size': '10', fill: MUTED }, labels.receipt));
  out.push(h('g', { stroke: '#4a4a66', 'stroke-width': '1.6', 'stroke-dasharray': '6 6' },
    systems.map((s) => h('path', { d: `M${x.get(s.id)} 72 V${bottom}` }))));
  systems.forEach((s) => out.push(
    h('rect', { x: x.get(s.id) - HEAD.w / 2, y: 18, width: HEAD.w, height: HEAD.h, rx: 14, fill: toneVar(s.tone) }),
    h('text', { x: x.get(s.id), y: 51, 'text-anchor': 'middle', 'font-size': '16', fill: s.tone === 'violet' ? '#fff' : '#0a0a0a' }, s.label)));
  const engine = systemsModel.engineId;
  const engineSys = systems.find((s) => s.id === engine);
  out.push(h('rect', { x: x.get(engine) - 8, y: top - 10, width: 16, height: bottom - top - 20, rx: 4, fill: toneVar(engineSys?.tone ?? 'violet'), opacity: '.75' }));

  fragments.forEach((f) => {
    const y1 = rowY(f.from) - 40; const y2 = rowY(f.to) + 22;
    const fx = x.get(engine) - 70; const fw = width - fx - 60;
    out.push(h('rect', { x: fx, y: y1, width: fw, height: y2 - y1, rx: 6, fill: 'rgba(200,255,61,.04)', stroke: 'var(--xw-lime)', 'stroke-width': '1.8' }),
      h('path', { d: `M${fx} ${y1} h56 v16 l-10 10 h-46 z`, fill: 'var(--xw-lime)' }),
      h('text', { x: fx + 24, y: y1 + 18, 'text-anchor': 'middle', 'font-size': '13', fill: '#0a0a0a' }, labels.alt),
      h('text', { x: fx + 70, y: y1 + 18, 'font-size': '13', fill: 'var(--xw-lime)' }, `[${f.guard}]`));
    for (const separator of f.separators) {
      const ey = rowY(separator.at) - 30;
      out.push(h('path', { d: `M${fx} ${ey} H${fx + fw}`, stroke: 'var(--xw-lime)', 'stroke-width': '1.4', 'stroke-dasharray': '6 5' }),
        h('text', { x: fx + 20, y: ey + 18, 'font-size': '13', fill: 'var(--xw-lime)' }, `[${separator.branch === 'no' ? labels.else : labels[separator.branch] ?? separator.branch}]`));
    }
  });

  let dot = 0;
  messages.forEach((m, i) => {
    const y = rowY(i);
    const x1 = x.get(m.from); const x2 = x.get(m.to);
    const mid = (x1 + x2) / 2;
    if (m.kind === 'self' || m.kind === 'wait') {
      const color = m.kind === 'wait' ? '#ffc53d' : '#e8e8f5';
      out.push(h('path', { d: `M${x1 + 8} ${y} H${x1 + 70} V${y + 30} H${x1 + 12}`, stroke: color, 'stroke-width': '2', fill: 'none', 'marker-end': marker(uid, m.kind === 'wait' ? 'arrow-amber' : 'arrow') }),
        h('text', { x: x1 + 80, y: y + 20, 'font-size': '13', fill: m.kind === 'wait' ? '#ffd77a' : '#e8e8f5' }, m.label));
    } else if (m.skipped) {
      out.push(h('text', { x: mid, y: y + 4, 'text-anchor': 'middle', 'font-size': '13', fill: MUTED }, `${m.label}: ${m.reason === 'disabled' ? labels.skipped : labels.notRun}`));
    } else {
      const color = m.kind === 'error' ? '#ff5c6c' : m.kind === 'reply' ? (m.label.startsWith('2') ? '#3dffa2' : '#a9a9c2') : '#e8e8f5';
      const dir = x2 > x1 ? 1 : -1;
      out.push(h('path', { d: `M${x1 + 8 * dir} ${y} H${x2 - 10 * dir}`, stroke: color, 'stroke-width': '2', 'stroke-dasharray': m.kind === 'call' ? null : '7 5', 'marker-end': marker(uid, m.kind === 'error' ? 'arrow-red' : m.kind === 'reply' && color === '#3dffa2' ? 'arrow-green' : m.kind === 'call' ? 'arrow' : 'arrow-muted') }),
        h('text', { x: mid, y: y - 9, 'text-anchor': 'middle', 'font-size': '14', fill: m.kind === 'error' ? '#ff8e9a' : color === '#3dffa2' ? '#3dffa2' : m.kind === 'reply' ? '#a9a9c2' : '#e8e8f5' }, m.label));
    }
    if (m.ledgerIndex) {
      const tone = m.kind === 'error' ? 'red' : DOT_TONES[dot % DOT_TONES.length];
      dot += 1;
      out.push(h('g', { class: 'xwf-seq-dot', role: 'button', tabindex: '0', 'aria-label': `${labels.ledgerRow} ${m.ledgerIndex}`, onClick: () => onLedger?.(m.ledgerIndex), onKeydown: (e) => { if (e.key === 'Enter') onLedger?.(m.ledgerIndex); } },
        h('circle', { cx: 55, cy: y, r: 13, fill: toneVar(tone) }),
        h('text', { x: 55, y: y + 4, 'text-anchor': 'middle', 'font-size': '12', 'font-family': 'JetBrains Mono', fill: tone === 'violet' ? '#fff' : '#0a0a0a' }, String(dot))));
    }
  });

  return svgRoot({ width, height, ariaLabel: `${labels.sequenceAria} ${flow.name}` }, defs(uid), out);
}
