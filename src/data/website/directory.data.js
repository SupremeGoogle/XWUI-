import { publicNodeTypes } from '../node-catalog.data.js';
import { gallery } from '../notations.data.js';
/** Public-site content and sample catalog. UI receives these records only through websiteApi. */
const demoFlow = `/studio/flows/${gallery.demoFlowId}`;
const anchor = (section) => `/?section=${section}`;
export const websiteDirectoryData = {
  directory: {
    editorPath: '/studio/flows/:flowId',
    emptyStudioPath: '/studio/flows',
    title: 'Integrations directory',
    eyebrow: 'Integrations',
    heading: 'Every step.',
    accent: 'One registry.',
    description:
      '{count} steps and connectors, read from the same catalog the studio palette uses. If it is listed here, you can drag it onto a canvas.',
    search: 'Search by name or what it does',
    searchLabel: 'Search integrations',
    groupsLabel: 'Groups',
    notice:
      'Local demo. Every card comes from the node-type catalog and is available in the studio palette.',
    empty: 'No integrations match your search',
    emptyDescription: 'Try another name or choose a different group.',
    extra: {
      title: 'App connectors',
      description:
        'Appear here as they are registered, each with its own page and depth label.',
    },
    pageSize: 12,
    searchDelay: 250,
  },
  categories: [
    { id: 'all', label: 'All' },
    { id: 'trig', label: 'Triggers', singular: 'Trigger', tone: 'lime' },
    { id: 'ctrl', label: 'Control flow', tone: 'orange' },
    { id: 'data', label: 'Data', tone: 'violet' },
    { id: 'ai', label: 'AI', tone: 'pink' },
    { id: 'int', label: 'Apps and APIs', tone: 'cyan' },
  ],
  integrations: publicNodeTypes.map(item => ({ ...item, path: `${demoFlow}?nodeType=${item.nodeType}` })),
  dialects: [
    ['n8n', 'n8', 'pink'],
    ['Zapier', 'Za', 'orange'],
    ['Power Automate', 'PA', 'blue'],
    ['Make', 'Mk', 'violet'],
    ['Activepieces', 'Ap', 'cyan'],
    ['Windmill', 'Wm', 'lime'],
    ['Node-RED', 'NR', 'red'],
    ['Temporal', 'Tm', 'amber'],
    ['Airflow', 'Af', 'green'],
    ['Camunda 8', 'C8', 'pink'],
  ].map(([name, initials, tone]) => ({
    name,
    initials,
    tone,
    depth: 'catalog',
  })),
  notationItems: [
    ['Node graph', '', 'lime'],
    ['Classic flowchart', 'flowchart', 'cyan'],
    ['Swimlanes', 'swimlane', 'violet'],
    ['BPMN 2.0.2', 'bpmn', 'orange'],
    ['BPMN 1.x', null, 'orange'],
    ['Choreography', null, 'orange'],
    ['Conversation', null, 'orange'],
    ['UML sequence', 'sequence', 'pink'],
    ['UML activity', null, 'pink'],
    ['State machine', null, 'pink'],
    ['Simulation', 'sim', 'amber'],
    ['Petri net'],
    ['DAG'],
    ['Data flow'],
    ['EPC'],
    ['IDEF0'],
    ['Value stream'],
    ['SIPOC'],
    ['Decision tree'],
    ['Blueprint'],
    ['Timeline'],
    ['Flow as code'],
    ['List mode'],
    ['3D space', '3d', 'lime'],
  ].map(([label, notation, tone = 'tx2']) => ({
    label,
    tone,
    path:
      notation === ''
        ? demoFlow
        : notation
          ? `${demoFlow}/view/${notation}`
          : null,
  })),

};
