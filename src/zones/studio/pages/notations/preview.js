

/** One demo flow, five render modes and a lazily mounted notation gallery. */
import { XWUICodeBlock } from '@exonware/xwui/basic';
import { h } from '../../../../core/dom.js';

import { template, formatDuration } from '../../../../core/format.js';
import { XWFFlowDiagram } from '../../../../components/XWFFlowDiagram/XWFFlowDiagram.js';
import { flowToMermaid, flowToList } from '../../../../components/XWFFlowDiagram/XWFFlowDiagram.logic.js';
import { XWFFlowCanvas } from '../../../../components/XWFFlowCanvas/XWFFlowCanvas.js';
import { XWFRunTimeline } from '../../../../components/XWFRunTimeline/XWFRunTimeline.js';
import { timelineRows } from '../run.page.js';


export function createNotationPreview({ flow, typeIndex, STUDIO_COPY, gallery, connections, catalog }) {
    function preview(host, notation, kit, thumbnail = true) {
      host.inert = thumbnail;
      if (notation === 'editor') {
        kit.scope.mount(
          XWFFlowCanvas,
          host,
          {
            graph: flow.graph,
            nodeTypes: typeIndex,
            nodeStates: {},
            portLabels: STUDIO_COPY.editor.ports,
            labels: STUDIO_COPY.editor.tools,
          },
          { readOnly: true, showTools: false, showMinimap: false },
        );
      } else if (notation === 'code') {
        kit.scope.mount(
          XWUICodeBlock,
          host,
          { code: flowToMermaid(flow.graph, typeIndex) },
          {
            language: 'text',
            copyable: false,
            upgradeToEditor: false,
          },
        );
      } else if (notation === 'list') {
        host.append(
          h(
            'ol',
            { class: 'listv' },
            flowToList(flow.graph, typeIndex).map((row) =>
              h(
                'li',
                { class: { ind: row.indent > 0 } },
                h('span', { class: 'mono sec' }, row.port ?? row.n),
                h('b', {}, row.name),
                h(
                  'span',
                  { class: 'xs sec' },
                  row.goTo
                    ? template(gallery.listCopy.goTo, { n: row.goTo })
                    : row.detail,
                ),
              ),
            ),
          ),
        );
      } else if (notation === 'timeline' && flow.lastRun) {
        const run = flow.lastRun;
        const total =
          run.durationMs ??
          Math.max(
            1,
            ...run.ledger.map(
              (row) => (row.offsetMs ?? 0) + (row.durationMs ?? 0),
            ),
          );
        kit.scope.mount(XWFRunTimeline, host, {
          rows: timelineRows(run, STUDIO_COPY.run),
          totalMs: total,
          startLabel: formatDuration(0),
          endLabel: formatDuration(total),
        });
      } else {
        kit.scope.mount(
          XWFFlowDiagram,
          host,
          {
            flow,
            nodeTypes: typeIndex,
            run: flow.lastRun,
            connections,
            lanes: catalog.lanes,
            labels: STUDIO_COPY.views.diagram,
          },
          { notation, thumbnail, animate: false },
        );
      }
    }

  return preview;
}
