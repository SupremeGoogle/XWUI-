/**
 * XWFFlowCanvas - logic.
 * State lives in XWUIComponentLogic; everything else here is pure graph and geometry
 * code (no DOM): port positions, edge paths, bounds, fit, tidy layout and graph edits.
 */
import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { XWF_FLOW_CANVAS_DEFINITION, XWF_NODE_GEOMETRY as G } from './XWFFlowCanvas.model.js';

export function createXWFFlowCanvasLogic(data = {}, conf = {}) {
  return new XWUIComponentLogic(XWF_FLOW_CANVAS_DEFINITION, data, conf);
}

/* ------------------------------------------------------------ geometry */

export function isBranching(type) {
  return Boolean(type?.ports?.includes('yes'));
}

export function nodeHeight(type) {
  return isBranching(type) ? G.branchHeight : G.baseHeight;
}

/** Output port centre in world coordinates. */
export function outPortPoint(node, type, port, width) {
  const y = isBranching(type) ? (G.branchPortsY[port] ?? G.portY) : G.portY;
  return { x: node.x + width, y: node.y + y };
}

export function inPortPoint(node) {
  return { x: node.x, y: node.y + G.portY };
}

/** Smooth horizontal bezier between two points. */
export function edgePath(a, b) {
  const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
  return `M${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

export function edgeGeometry(graph, types, width) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  return graph.edges.map((edge) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) return null;
    const a = outPortPoint(from, types[from.type], edge.port, width);
    const b = inPortPoint(to);
    return { ...edge, a, b, d: edgePath(a, b), labelAt: { x: a.x + 12, y: a.y - 8 } };
  }).filter(Boolean);
}

export function graphBounds(graph, types, width) {
  const boxes = [
    ...graph.nodes.map((n) => ({ x: n.x, y: n.y, w: width, h: nodeHeight(types[n.type]) })),
    ...(graph.frames ?? []).map((f) => ({ x: f.x, y: f.y, w: f.w, h: f.h })),
  ];
  if (!boxes.length) return { x: 0, y: 0, w: 1, h: 1 };
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w));
  const maxY = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function clampZoom(k, min, max) {
  return Math.min(max, Math.max(min, k));
}

/** Transform that fits the bounds into a viewport rectangle with padding. */
export function fitTransform(bounds, viewport, { padding = 80, min = 0.4, max = 1.25 } = {}) {
  const k = clampZoom(Math.min((viewport.w - padding * 2) / bounds.w, (viewport.h - padding * 2) / bounds.h), min, max);
  return {
    k,
    x: viewport.x + (viewport.w - bounds.w * k) / 2 - bounds.x * k,
    y: viewport.y + (viewport.h - bounds.h * k) / 2 - bounds.y * k,
  };
}

/** Zoom around a screen point so the world point under it stays put. */
export function zoomAround(transform, factor, point, min, max) {
  const k = clampZoom(transform.k * factor, min, max);
  const ratio = k / transform.k;
  return { k, x: point.x - (point.x - transform.x) * ratio, y: point.y - (point.y - transform.y) * ratio };
}

export function screenToWorld(transform, point) {
  return { x: (point.x - transform.x) / transform.k, y: (point.y - transform.y) / transform.k };
}

/* ------------------------------------------------------------ layout */

/**
 * Tidy: columns by distance from the trigger, rows by branch order. Keeps the first
 * trigger where it is so the drawing does not jump away.
 */
export function tidyLayout(graph, types, gap) {
  const incoming = new Map(graph.nodes.map((n) => [n.id, 0]));
  graph.edges.forEach((e) => incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1));
  const roots = graph.nodes.filter((n) => !incoming.get(n.id));
  const depth = new Map();
  const queue = roots.map((n) => [n.id, 0]);
  while (queue.length) {
    const [id, d] = queue.shift();
    if (depth.has(id) && depth.get(id) >= d) continue;
    depth.set(id, d);
    graph.edges.filter((e) => e.from === id).forEach((e) => queue.push([e.to, d + 1]));
  }
  graph.nodes.forEach((n) => { if (!depth.has(n.id)) depth.set(n.id, 0); });
  const columns = new Map();
  graph.nodes.forEach((n) => {
    const d = depth.get(n.id);
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d).push(n);
  });
  const anchor = roots[0] ?? graph.nodes[0] ?? { x: 0, y: 0 };
  const origin = { x: anchor.x, y: anchor.y };
  const positions = new Map();
  [...columns.entries()].forEach(([d, nodes]) => {
    nodes.forEach((n, i) => {
      const offset = (i - (nodes.length - 1) / 2) * gap.y;
      positions.set(n.id, { x: origin.x + d * gap.x, y: Math.round(origin.y + offset) });
    });
  });
  return { ...graph, nodes: graph.nodes.map((n) => ({ ...n, ...positions.get(n.id) })) };
}

/* ------------------------------------------------------------ edits */

export function uniqueId(prefix, taken) {
  let i = taken.length + 1;
  while (taken.includes(`${prefix}${i}`)) i += 1;
  return `${prefix}${i}`;
}

export function moveNode(graph, id, x, y) {
  return { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n)) };
}

export function updateNode(graph, id, patch) {
  return { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) };
}

export function removeNode(graph, id) {
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => n.id !== id),
    edges: graph.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

export function removeEdge(graph, id) {
  return { ...graph, edges: graph.edges.filter((e) => e.id !== id) };
}

/** First output port of `fromId` that has no edge yet (or its first port). */
export function freePort(graph, fromNode, type) {
  const ports = type?.ports?.length ? type.ports : ['out'];
  const used = new Set(graph.edges.filter((e) => e.from === fromNode.id).map((e) => e.port));
  return ports.find((p) => !used.has(p)) ?? null;
}

/** Connect two nodes. Rejects self-loops, duplicates and edges into triggers. */
export function connect(graph, fromId, port, toId, types) {
  if (fromId === toId) return { graph, ok: false, reason: 'self' };
  const to = graph.nodes.find((n) => n.id === toId);
  if (types[to?.type]?.group === 'trigger') return { graph, ok: false, reason: 'trigger' };
  if (graph.edges.some((e) => e.from === fromId && e.port === port)) {
    graph = { ...graph, edges: graph.edges.filter((e) => !(e.from === fromId && e.port === port)) };
  }
  if (graph.edges.some((e) => e.from === fromId && e.to === toId)) return { graph, ok: false, reason: 'duplicate' };
  const id = uniqueId('e', graph.edges.map((e) => e.id));
  return { graph: { ...graph, edges: [...graph.edges, { id, from: fromId, port, to: toId }] }, ok: true, edgeId: id };
}

/**
 * Add a node of `type`. When `after` is given it is placed to the right of that node and
 * wired from its first free port.
 */
export function addNode(graph, { type, name, params = {}, at = null, after = null }, types, width) {
  const id = uniqueId('n_', graph.nodes.map((n) => n.id));
  const afterNode = after ? graph.nodes.find((n) => n.id === after) : null;
  const position = at ?? (afterNode ? { x: afterNode.x + width + 50, y: afterNode.y } : { x: 120, y: 200 });
  let next = { ...graph, nodes: [...graph.nodes, { id, type, name, x: Math.round(position.x), y: Math.round(position.y), disabled: false, pinned: false, params }] };
  if (afterNode) {
    const port = freePort(graph, afterNode, types[afterNode.type]);
    if (port) next = connect(next, afterNode.id, port, id, types).graph;
  }
  return { graph: next, id };
}

/** Pure: minimap rectangles (scaled into the minimap box). */
export function minimapModel(graph, types, width, transform, viewport, box) {
  const bounds = graphBounds(graph, types, width);
  const scale = Math.min((box.width - box.padding * 2) / bounds.w, (box.height - box.padding * 2) / bounds.h);
  const map = (x, y) => ({ x: box.padding + (x - bounds.x) * scale, y: box.padding + (y - bounds.y) * scale });
  const nodes = graph.nodes.map((n) => {
    const p = map(n.x, n.y);
    return { id: n.id, x: p.x, y: p.y, w: width * scale, h: nodeHeight(types[n.type]) * scale, tone: types[n.type]?.tone, disabled: n.disabled };
  });
  const tl = screenToWorld(transform, { x: viewport.x, y: viewport.y });
  const br = screenToWorld(transform, { x: viewport.x + viewport.w, y: viewport.y + viewport.h });
  const v1 = map(tl.x, tl.y);
  const v2 = map(br.x, br.y);
  return {
    nodes,
    view: { x: v1.x, y: v1.y, w: v2.x - v1.x, h: v2.y - v1.y },
    toWorld: (mx, my) => ({ x: bounds.x + (mx - box.padding) / scale, y: bounds.y + (my - box.padding) / scale }),
  };
}
