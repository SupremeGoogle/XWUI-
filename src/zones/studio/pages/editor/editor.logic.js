/**
 * Flow editor - page logic (pure, no DOM): node run states, problem checks, ledger rows.
 */
import { template } from '../../../../core/format.js';

/** Map the latest ledger to the status line each node shows on the canvas. */
export function nodeStatesFromRun(graph, run, catalog, copy) {
  const states = {};
  graph.nodes.forEach((n) => {
    if (n.disabled) states[n.id] = { label: catalog.stepResults.disabled.label, kind: 'dis' };
    else if (n.pinned) states[n.id] = { label: copy.pinned, kind: 'pin' };
  });
  if (!run) return states;
  graph.nodes.forEach((n) => {
    const rows = run.ledger.filter((r) => r.nodeId === n.id);
    const last = rows.at(-1);
    if (!last || n.disabled) return;
    if (last.result === 'pinned') { states[n.id] = { label: copy.pinned, kind: 'pin' }; return; }
    const result = catalog.stepResults[last.result] ?? catalog.stepResults.not_run;
    let label = result.label;
    if (last.result === 'succeeded' && (last.maxAttempts ?? 1) > 1 && last.attempt > 1) label = template(copy.tryOf, { n: last.attempt, max: last.maxAttempts });
    if (last.result === 'failed' && last.error?.status) label = `${result.label}, ${last.error.status}`;
    states[n.id] = { label, kind: result.st };
  });
  return states;
}

/** Things that stop a flow from running as intended. */
export function findProblems(graph, typeIndex, copy) {
  const problems = [];
  const trigger = graph.nodes.find((n) => typeIndex[n.type]?.group === 'trigger');
  if (!trigger) problems.push({ level: 'error', text: copy.noTrigger });
  const reachable = new Set();
  if (trigger) {
    const queue = [trigger.id];
    while (queue.length) {
      const id = queue.shift();
      if (reachable.has(id)) continue;
      reachable.add(id);
      graph.edges.filter((e) => e.from === id).forEach((e) => queue.push(e.to));
    }
  }
  graph.nodes.forEach((n) => {
    const type = typeIndex[n.type];
    const needsConn = type?.fields?.some((f) => f.kind === 'connection') && !n.params?.connectionId;
    if (needsConn || n.needsConnection) problems.push({ level: 'warning', nodeId: n.id, text: template(copy.needsConnection, { step: n.name }) });
    if (n.disabled) problems.push({ level: 'info', nodeId: n.id, text: template(copy.disabled, { step: n.name }) });
    if (trigger && !reachable.has(n.id)) problems.push({ level: 'warning', nodeId: n.id, text: template(copy.unreachable, { step: n.name }) });
    (type?.ports ?? []).filter((p) => p !== 'out').forEach((port) => {
      if (!graph.edges.some((e) => e.from === n.id && e.port === port)) problems.push({ level: 'info', nodeId: n.id, text: template(copy.openBranch, { step: n.name, port }) });
    });
  });
  return problems;
}

/** Summary counts for the run panel header. */
export function runSummary(run) {
  if (!run) return null;
  const finalPerNode = new Map();
  run.ledger.forEach((r) => finalPerNode.set(r.nodeId, r));
  const finals = [...finalPerNode.values()];
  return {
    finished: finals.filter((r) => ['succeeded', 'pinned'].includes(r.result) || r.result.startsWith('took_')).length,
    failed: finals.filter((r) => r.result === 'failed').length,
    disabled: finals.filter((r) => r.result === 'disabled').length,
    running: run.status === 'running',
  };
}

/** In/out item counts per ledger row (1 item flows through a recorded attempt). */
export function ledgerItems(row) {
  const recorded = row.attempt > 0 && row.result !== 'running';
  const isTrigger = row.index === 1;
  return {
    in: recorded && !isTrigger ? 1 : 0,
    out: recorded && row.result !== 'failed' ? 1 : 0,
  };
}
