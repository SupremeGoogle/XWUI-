/**
 * Studio sample data (the dummy backend's database).
 * Only src/api/studio.api.js reads this file.
 *
 * Times are stored as offsets ("ago") and turned into ISO dates when the API seeds its
 * collections, so relative labels ("2 min ago") stay true whenever the demo is opened.
 */

/* ------------------------------------------------------------------ people */

export const users = [
  { id: 'u_you', name: 'You', initials: 'YO', gradient: 'var(--xw-grad)' },
  { id: 'u_sam', name: 'Sam Rivers', initials: 'SR', gradient: 'var(--xw-grad2)' },
];

export const currentUserId = 'u_you';

export const project = {
  id: 'p_personal',
  name: 'Personal',
  visibility: 'Private',
  description: 'All the flows, agents, tables, forms, connections, variables, runs and MCP servers in this project.',
  sampleNotice: 'Sample rows',
};

export const usage = {
  usedRuns: 3820,
  includedRuns: 10000,
  periodEnds: { days: 19 },
  label: '{used} of {included} runs',
  periodLabel: 'Period ends {date}',
};

/* ------------------------------------------------------------- node catalog */

export { nodeGroups, nodeTypes } from '../node-catalog.data.js';

/** Lanes used by the swimlane, BPMN and sequence views. */
export const lanes = [
  { id: 'source', label: 'Trigger source', tone: 'lime' },
  { id: 'engine', label: 'xwflow engine', tone: 'orange' },
  { id: 'ai', label: 'AI model', tone: 'pink' },
  { id: 'apps', label: 'Apps and APIs', tone: 'cyan' },
  { id: 'data', label: 'Tables', tone: 'violet' },
];

/* ------------------------------------------------------------- connections */

