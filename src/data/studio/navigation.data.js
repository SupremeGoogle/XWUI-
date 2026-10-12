import { STUDIO_ROUTES } from '../../core/routes.js';
export const studioAssetRefs = {
  emptyFlows: 'illustration-empty-flows',
  emptyRuns: 'illustration-empty-runs',
};

export const studioNav = {
  brand: 'xwflow',
  collapseLabel: 'Collapse the rail',
  expandLabel: 'Expand the rail',
  searchPlaceholder: 'Search',
  searchLabel: 'Search everything',
  searchShortcut: 'Ctrl K',
  createLabel: 'Create',
  primary: [
    { id: 'assistant', label: 'Assistant', icon: 'sparkles', route: '/studio', badge: { label: 'Preview', tone: 'primary' } },
    { id: 'overview', label: 'Overview', icon: 'home', route: '/studio/flows' },
  ],
  projectGroup: 'Project',
  chatsGroup: 'Chats',
  footer: [
    { id: 'admin', label: 'Admin panel', icon: 'shield', route: '/admin' },
    { id: 'templates', label: 'Templates', icon: 'layers', route: STUDIO_ROUTES.templates },
    { id: 'insights', label: 'Insights', icon: 'chart', route: STUDIO_ROUTES.insights },
    { id: 'settings', label: 'Settings', icon: 'settings', route: STUDIO_ROUTES.settings },
  ],
  helpLabel: 'Help',
  help: {
    title: 'Studio keyboard shortcuts',
    body: 'Canvas shortcuts apply to the selected step. Search works throughout Studio; assistant focus works on the assistant home and in the editor.',
    close: 'Got it',
    shortcuts: [
      { keys: ['Ctrl', 'K'], label: 'Search flows, runs and connections' },
      { keys: ['Ctrl', 'Enter'], label: 'Run the flow' },
      { keys: ['F2'], label: 'Rename the selected step' },
      { keys: ['P'], label: 'Pin the selected step output' },
      { keys: ['Delete'], label: 'Delete the selected step or connection' },
      { keys: ['←', '↑', '↓', '→'], label: 'Move the selected step' },
      { keys: ['Tab'], label: 'Focus the step palette' },
      { keys: ['Ctrl', 'I'], label: 'Focus the assistant' },
    ],
  },
  accountLabel: 'Your account',
  createMenu: [
    { id: 'flow', label: 'Flow', icon: 'workflow', action: 'create-flow' },
    { id: 'assistant', label: 'Describe it to the assistant', icon: 'sparkles', route: '/studio' },
  ],
};

/** Project tabs (flows / runs / connections pages). */
export const projectTabs = [
  { id: 'flows', label: 'Flows', route: '/studio/flows' },
  { id: 'agents', label: 'Agents', route: STUDIO_ROUTES.agents },
  { id: 'tables', label: 'Tables', route: STUDIO_ROUTES.tables },
  { id: 'forms', label: 'Forms', route: STUDIO_ROUTES.forms },
  { id: 'connections', label: 'Connections', route: '/studio/connections' },
  { id: 'variables', label: 'Variables', route: STUDIO_ROUTES.variables },
  { id: 'runs', label: 'Runs', route: '/studio/runs' },
  { id: 'mcp', label: 'MCP servers', route: STUDIO_ROUTES.mcp },
];

/** Notation views reachable from the editor and the gallery. */
export const notations = [
  { id: 'editor', label: 'Node graph', short: 'Editor', route: '/studio/flows/:flowId' },
  { id: 'flowchart', label: 'Classic flowchart', short: 'Flowchart', route: '/studio/flows/:flowId/view/flowchart' },
  { id: 'swimlane', label: 'Swimlanes', short: 'Swimlanes', route: '/studio/flows/:flowId/view/swimlane' },
  { id: 'bpmn', label: 'BPMN 2.0.2', short: 'BPMN', route: '/studio/flows/:flowId/view/bpmn' },
  { id: 'sequence', label: 'UML sequence', short: 'Sequence', route: '/studio/flows/:flowId/view/sequence' },
  { id: 'sim', label: 'Simulation', short: 'Simulation', route: '/studio/flows/:flowId/view/sim' },
  { id: '3d', label: '3D space', short: '3D', route: '/studio/flows/:flowId/view/3d' },
];

/* ------------------------------------------------------- editor assistant */

/** "Ask AI" in the editor: which words map to which step type. */
export const editorAssistant = {
  examples: ['Add a wait for approval', 'Email finance when it fails', 'Explain this flow'],
  explainWords: ['explain', 'what does', 'describe', 'summary'],
  keywordsByType: {
    send_email: ['email', 'mail'],
    post_message: ['message', 'chat', 'notify', 'slack', 'post'],
    wait: ['wait', 'pause', 'approval', 'delay'],
    condition: ['condition', 'if ', 'check', 'branch'],
    ai_condition: ['ai', 'model', 'classify', 'qualify'],
    http_request: ['http', 'api', 'request', 'call', 'fetch'],
    code: ['code', 'script', 'javascript'],
    set_fields: ['field', 'set ', 'map', 'rename'],
    append_row: ['row', 'table', 'log', 'record', 'sheet'],
    merge: ['merge', 'join'],
  },
  explainIntro: '{name} starts with {trigger}.',
  explainStep: 'Then {step} ({type}).',
  explainBranch: '{step} sends items down the {port} branch to {target}.',
  explainDisabled: '{step} is disabled, so runs skip it.',
};
