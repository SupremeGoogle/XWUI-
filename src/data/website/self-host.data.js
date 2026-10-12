import { publicNodeTypes } from '../node-catalog.data.js';
import { gallery } from '../notations.data.js';
/** Public-site content and sample catalog. UI receives these records only through websiteApi. */
const demoFlow = `/studio/flows/${gallery.demoFlowId}`;
const anchor = (section) => `/?section=${section}`;
export const websiteSelfhostData = {
  selfHost: {
    title: 'Self-host quickstart',
    eyebrow: 'Self-host',
    heading: 'Your servers.',
    accent: 'Your secrets.',
    description:
      'Install it, start it, build a first flow. The target is under ten minutes from a clean machine, and every credential stays where you put it.',
    actions: [
      {
        label: 'Start the quickstart',
        path: '/self-host?section=steps',
        variant: 'primary',
      },
      { label: 'Need a licence?', path: '/pricing', variant: 'outline' },
    ],
    steps: [
      {
        title: 'Install the package',
        description:
          'The default install is lean. Optional features load only when you add their extra.',
        code: '# any Python environment\npip install exonware-xwflow',
        tone: 'lime',
      },
      {
        title: 'Start the API',
        description:
          'It answers under /xwflow/v1 on 127.0.0.1:8090 by default.',
        code: '# exact command: from the release notes\nSTART COMMAND',
        tone: 'cyan',
      },
      {
        title: 'Check that it answers',
        description:
          'The catalog returns JSON. If you get an HTML page, the studio is being served where the API should be.',
        code: 'curl http://127.0.0.1:8090/xwflow/v1/node-types',
        tone: 'violet',
      },
      {
        title: 'Open the studio',
        description:
          'The web tier serves on 127.0.0.1:5178. Change it with XWFLOW_WEB_HOST and XWFLOW_WEB_PORT.',
        code: 'WEB START COMMAND',
        tone: 'pink',
      },
      {
        title: 'Build and run a first flow',
        tone: 'orange',
        items: [
          'Add a Webhook, an HTTP request and a Condition.',
          'Press Ctrl + Enter to run it.',
          "Open the receipt and read the HTTP request's input.",
        ],
        actions: [
          { label: 'See the editor', path: demoFlow, variant: 'primary' },
          {
            label: 'See a receipt',
            path: '/studio/runs/run_order_alert_001',
            variant: 'outline',
          },
        ],
      },
    ],
    defaults: {
      title: 'Defaults',
      items: [
        { label: 'API', value: '127.0.0.1:8090' },
        { label: 'Base path', value: '/xwflow/v1' },
        { label: 'Studio', value: '127.0.0.1:5178' },
      ],
    },
    secrets: {
      title: 'Secrets stay here',
      description:
        "The studio shows a credential's name and health. It never offers a reveal control.",
    },
    warning:
      'Two start commands are placeholders until the release notes name them.',
  },
};
