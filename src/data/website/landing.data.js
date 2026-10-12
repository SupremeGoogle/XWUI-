import { publicNodeTypes } from '../node-catalog.data.js';
import { gallery } from '../notations.data.js';
/** Public-site content and sample catalog. UI receives these records only through websiteApi. */
const demoFlow = `/studio/flows/${gallery.demoFlowId}`;
const anchor = (section) => `/?section=${section}`;
export const websiteLandingData = {
  landing: {
    directoryLabel: 'Steps you can use',
    brandingPath: '/admin/branding',
    comparisonPrefix: 'vs',
    title: 'Workflow automation you own',
    announcement: 'New: describe a flow, the assistant drafts it',
    preview: 'Preview',
    hero: {
      heading: 'Own the workflow.',
      accent: 'Watch every action.',
      description:
        'Build automations on a canvas that never hides what happened. Every step attempt leaves a receipt. Host it yourself, or ship it under your own brand.',
      actions: [
        {
          label: 'Build a flow, no account',
          path: anchor('sandbox'),
          variant: 'primary',
        },
        { label: 'Self-host it', path: '/self-host', variant: 'outline' },
      ],
      promises: [
        'Apache-2.0 core',
        'Your credentials stay on your servers',
        'English and Arabic',
      ],
    },
    scene: {
      title: 'Order alert sandbox',
      asked: 'YOU ASKED',
      prompt: 'Tell sales when an order is over 500, and log every order.',
      draft: 'Draft built: 5 steps',
      receiptTitle: 'Run receipt',
      sample: 'Sample',
      nodes: [
        {
          id: 'order',
          name: 'New order',
          type: 'Webhook',
          icon: 'bolt',
          tone: 'lime',
          status: 'Done, 1 item',
          variant: 'success',
          x: 40,
          y: 240,
          z: 50,
        },
        {
          id: 'customer',
          name: 'Look up customer',
          type: 'HTTP request',
          icon: 'world',
          tone: 'cyan',
          status: 'Done on try 2',
          variant: 'success',
          x: 310,
          y: 240,
          z: 70,
        },
        {
          id: 'condition',
          name: 'Order over 500?',
          type: 'Condition',
          icon: 'git-branch',
          tone: 'orange',
          status: 'Took yes',
          variant: 'success',
          x: 580,
          y: 236,
          z: 90,
        },
        {
          id: 'sales',
          name: 'Notify sales',
          type: 'Post a message',
          icon: 'message',
          tone: 'pink',
          status: 'Running',
          variant: 'info',
          x: 830,
          y: 110,
          z: 110,
        },
        {
          id: 'log',
          name: 'Log order',
          type: 'Append a row',
          icon: 'database',
          tone: 'violet',
          status: 'Not run',
          variant: 'neutral',
          x: 830,
          y: 380,
          z: 40,
        },
      ],
      receipt: [
        {
          label: 'New order',
          value: '12 ms',
          variant: 'success',
          progress: 4,
          tone: 'lime',
        },
        {
          label: 'Look up customer, try 1',
          value: '503',
          variant: 'error',
          progress: 48,
          tone: 'red',
        },
        {
          label: 'Look up customer, try 2',
          value: '212 ms',
          variant: 'success',
          progress: 20,
          tone: 'cyan',
        },
        {
          label: 'Order over 500?',
          value: 'yes',
          variant: 'success',
          progress: 3,
          tone: 'orange',
        },
        {
          label: 'Notify sales',
          value: 'running',
          variant: 'info',
          progress: 21,
          tone: 'pink',
        },
      ],
      controls: {
        reset: 'Reset the sandbox',
        out: 'Zoom out',
        in: 'Zoom in',
        run: 'Run flow',
      },
      complete: 'Sample run completed. Every attempt is recorded.',
      completedStatus: 'Done',
      idleStatus: 'Not run',
    },
    stats: [
      {
        title: 'steps and connectors',
        countSource: 'integrations',
        footnote: 'Available in the local registry.',
      },
      {
        title: 'workflow dialects',
        countSource: 'dialects',
        footnote: 'Import from the tools you use today.',
      },
      {
        title: 'per step attempt',
        value: '1 row',
        footnote: 'Failures included. Nothing is summarised away.',
      },
      {
        title: 'vendor marks',
        value: 0,
        footnote: 'On a branded tenant. Planned.',
      },
    ],
    prompt: {
      eyebrow: 'Prompt to flow',
      heading: 'Say what you want.',
      accent: 'Get a flow you can read.',
      description:
        'The assistant drafts steps on the canvas while you watch. It asks before it connects anything, and it never publishes or runs a live action on its own.',
      value: 'Every Monday, email finance the invoices that are overdue',
      workspace: 'Personal',
      action: 'Build it',
      path: '/studio',
      suggestions: ['Weekly digest', 'Sync two tables', 'Route support email'],
      draft: 'Draft',
      streaming: 'Streaming',
      count: '4 steps',
      steps: [
        {
          name: 'Every Monday, 08:00',
          type: 'Schedule',
          icon: 'clock',
          tone: 'lime',
        },
        {
          name: 'Fetch invoices',
          type: 'HTTP request',
          icon: 'world',
          tone: 'cyan',
        },
        {
          name: 'Keep overdue ones',
          type: 'Condition',
          icon: 'git-branch',
          tone: 'orange',
        },
        {
          name: 'Email finance',
          type: 'Needs a connection',
          icon: 'mail',
          tone: 'pink',
        },
      ],
      notice: 'Connect an email account to finish. The assistant asks first.',
    },
    features: {
      eyebrow: 'Built different',
      heading: 'A builder that tells you',
      accent: 'the truth about state.',
      receipt: {
        tag: 'The receipt',
        title: 'The receipt is the debugger.',
        text: 'One row per attempt of every step. Read it, export it, compare two runs side by side.',
      },
      states: {
        tag: 'Honest states',
        title: 'Every state has a name.',
        items: [
          { label: 'Pinned data', variant: 'info' },
          { label: 'Disabled step', variant: 'neutral' },
          { label: 'Unpublished changes', variant: 'warning' },
          { label: 'Not recorded', variant: 'neutral' },
        ],
      },
      keyboard: {
        tag: 'Keyboard first',
        title: 'Your hands stay on the keys.',
        keys: ['Ctrl', 'Enter', 'Tab', '?'],
        text: 'And a list mode: every canvas action in a plain list, for keyboards and screen readers.',
      },
      languages: {
        tag: 'Two languages',
        arabic: 'أتمتة',
        text: 'Panels mirror in Arabic. The graph does not: a flow runs left to right in every language.',
      },
      hosting: { tag: 'Self-host', title: 'Runs on your metal.' },
    },
    whiteLabel: {
      eyebrow: 'White-label',
      heading: 'Your brand.',
      accent: 'Not ours.',
      description:
        'Rebuild the look from a brand kit. On a branded tenant no xwflow name, logo or link appears anywhere, including the OAuth consent screen.',
      features: [
        'Brand kit per tenant: name, logo, palette, type',
        'Custom domain per tenant',
        'Your own OAuth client on consent screens',
        'Embed the studio in your own app',
      ],
      action: 'See the white-label tier',
      path: '/pricing',
      brands: [
        { name: 'Atlas Ops', tone: 'cyan' },
        { name: 'Nova Flow', tone: 'pink' },
        { name: 'Acme Auto', tone: 'lime' },
      ],
      run: 'Run',
      published: 'Published',
      note: 'No xwflow string on this screen.',
    },
    notations: {
      eyebrow: 'Every notation',
      heading: 'One flow.',
      accent: '24 ways to see it.',
      description:
        'Node graph for builders, BPMN for process teams, sequence diagrams for engineers, simulation for planners, 3D for everyone. Switch views without redrawing anything.',
      actions: [
        { label: 'See the gallery', path: '/notations', variant: 'primary' },
        {
          label: 'Open the 3D view',
          path: `${demoFlow}/view/3d`,
          variant: 'outline',
        },
      ],
    },
    migration: {
      eyebrow: 'Migrate',
      heading: 'Bring your flows.',
      accent: 'We say what transfers.',
      description:
        'Depth is read from the adapter catalog. A dialect at depth None does not transfer, and its page says so out loud.',
      depth: 'Depth',
      catalog: 'catalog',
    },
    cta: {
      eyebrow: 'Start now',
      heading: 'Your first flow,',
      accent: 'three minutes out.',
      description:
        'No account. The sandbox runs in your browser on sample data, so nothing leaves the page.',
      actions: [
        {
          label: 'Open the sandbox',
          path: anchor('sandbox'),
          variant: 'primary',
        },
        {
          label: 'Self-host quickstart',
          path: '/self-host',
          variant: 'outline',
        },
      ],
    },
    resources: {
      comparison: {
        title: 'Compare your workflow',
        names: ['Make', 'n8n', 'Zapier', 'Power Automate'],
        text: 'Explore how xwflow keeps attempts, credentials and published versions visible. Migration depth is sample catalog data; inspect each adapter before moving a production flow.',
        features: [
          'A receipt for every step attempt',
          'Self-hosted credentials',
          'Published versions separate from drafts',
        ],
        action: 'Explore the studio',
        path: '/studio',
      },
      templates: {
        title: 'Start from a template',
        items: [
          { label: 'Order alert to sales', path: demoFlow },
          {
            label: 'Weekly invoice digest',
            path: '/studio/flows/flow_weekly_digest',
          },
          {
            label: 'Sync customers to the sheet',
            path: '/studio/flows/flow_sync_customers',
          },
        ],
      },
      capabilities: {
        title: 'Capability status',
        items: [
          {
            label: 'Canvas and run receipts',
            status: 'Available',
            variant: 'success',
          },
          { label: 'Assistant drafts', status: 'Preview', variant: 'info' },
          {
            label: 'White-label capabilities',
            status: 'Planned',
            variant: 'neutral',
          },
        ],
      },
      docs: {
        title: 'Documentation',
        text: 'Follow the self-host quickstart, then explore the sample flow and its run receipt.',
        action: 'Self-host quickstart',
        path: '/self-host',
      },
      security: {
        title: 'Your credentials stay on your servers',
        text: 'The studio shows credential names and health. Stored secrets are never exposed in the interface.',
        action: 'View connections',
        path: '/studio/connections',
      },
    },
  },

};
