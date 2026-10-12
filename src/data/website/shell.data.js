import { publicNodeTypes } from '../node-catalog.data.js';
import { gallery } from '../notations.data.js';
/** Public-site content and sample catalog. UI receives these records only through websiteApi. */
const demoFlow = `/studio/flows/${gallery.demoFlowId}`;
const anchor = (section) => `/?section=${section}`;
export const websiteShellData = {
  assetRefs: {
    mark: 'brand-logo-mark',
    avatar: 'avatar-1',
    hero: 'illustration-hero-flow',
    servers: 'illustration-self-host-servers',
    search: 'illustration-empty-search',
    generic: 'illustration-empty-generic',
    lock: 'illustration-denied-lock',
    healthy: 'illustration-health-ok',
    alert: 'illustration-health-alert',
    cube: 'illustration-pricing-cube',
    samples: [1, 2, 3].map((index) => ({
      logo: `sample-logo-${index}`,
      favicon: `sample-favicon-${index}`,
    })),
  },
  assetIds: [
    'brand-logo-mark',
    'brand-logo-full',
    'illustration-hero-flow',
    'illustration-self-host-servers',
    'illustration-empty-search',
    'illustration-pricing-cube',
    'sample-logo-1',
    'sample-logo-2',
    'sample-logo-3',
    'node-webhook',
    'node-schedule',
    'node-condition',
    'node-wait',
    'node-merge',
    'node-code',
    'node-set-fields',
    'node-ai-condition',
    'node-http-request',
    'node-post-message',
    'node-append-row',
    'node-send-email',
  ],
  navigation: {
    brand: 'xwflow',
    home: '/',
    primaryLabel: 'Primary',
    items: [
      { id: 'product', label: 'Product', ar: 'المنتج', path: anchor('how') },
      {
        id: 'notations',
        label: 'Notations',
        ar: 'المخططات',
        path: '/notations',
      },
      {
        id: 'integrations',
        label: 'Integrations',
        ar: 'التكاملات',
        path: '/integrations',
      },
      {
        id: 'migrate',
        label: 'Migrate',
        ar: 'الانتقال',
        path: anchor('compat'),
      },
      { id: 'pricing', label: 'Pricing', ar: 'الأسعار', path: '/pricing' },
      {
        id: 'self-host',
        label: 'Self-host',
        ar: 'الاستضافة الذاتية',
        path: '/self-host',
      },
      { id: 'docs', label: 'Docs', ar: 'التوثيق', path: anchor('docs') },
    ],
    language: { en: 'العربية', ar: 'English' },
    actions: [
      {
        label: 'Sign in',
        ar: 'تسجيل الدخول',
        path: '/studio',
        variant: 'ghost',
      },
      {
        label: 'Start building',
        ar: 'ابدأ البناء',
        path: anchor('sandbox'),
        variant: 'primary',
      },
    ],
    footer: {
      description:
        'Workflow automation you own, with a receipt for every action.',
      tags: ['Apache-2.0 core', 'EN / AR'],
      columns: [
        {
          title: 'Product',
          links: [
            ['How it works', anchor('how')],
            ['Integrations', '/integrations'],
            ['Templates', anchor('t')],
            ['Capability status', anchor('s')],
          ],
        },
        {
          title: 'Compare',
          links: ['Make', 'n8n', 'Zapier', 'Power Automate'].map((name) => [
            `vs ${name}`,
            `/?section=c&compare=${encodeURIComponent(name)}`,
          ]),
        },
        {
          title: 'Migrate',
          links: [
            ['From n8n', anchor('compat')],
            ['From Zapier', anchor('compat')],
            ['From Make', anchor('compat')],
            ['All ten', anchor('compat')],
          ],
        },
        {
          title: 'Resources',
          links: [
            ['Docs', anchor('docs')],
            ['Self-host', '/self-host'],
            ['Pricing', '/pricing'],
            ['Security', anchor('sec')],
          ],
        },
      ],
      license: 'Core released under Apache-2.0.',
      sourceLabel: 'Source',
      source: 'https://github.com/SupremeGoogle/XWUI-',
    },
  },
  labels: {
    loading: 'Loading',
    retry: 'Try again',
    close: 'Close',
    copied: 'Copied to clipboard.',
    copy: 'Copy command',
    copyError: 'Clipboard unavailable. Select and copy the command.',
    clear: 'Clear filters',
    view: 'View the step',
    studio: 'Open in the studio',
    planned: 'Planned',
    featured: 'Featured',
    next: 'Next',
    previous: 'Previous',
    loadMore: 'Load more',
    sample: 'Sample data',
  },

};
