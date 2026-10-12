import { publicNodeTypes } from '../node-catalog.data.js';
import { gallery } from '../notations.data.js';
/** Public-site content and sample catalog. UI receives these records only through websiteApi. */
const demoFlow = `/studio/flows/${gallery.demoFlowId}`;
const anchor = (section) => `/?section=${section}`;
export const websitePricingData = {
  pricing: {
    title: 'Pricing',
    eyebrow: 'Pricing',
    heading: 'Free to own.',
    accent: 'Paid to scale.',
    description:
      'The open core runs real automations. Commercial adds the controls an organisation or a reseller needs.',
    tiers: [
      {
        id: 'core',
        name: 'Core',
        tag: 'Open source',
        description: 'Self-hosted, Apache-2.0.',
        price: 'Free',
        tone: 'lime',
        action: 'Self-host quickstart',
        path: '/self-host',
        features: [
          'Studio canvas, palette, inspector, run view',
          'Run receipts and executions',
          'Credentials kept on your servers',
          'Versions, publish requests, graph diff',
          'Audit view and download, alert routing',
          'One tenant',
        ],
      },
      {
        id: 'commercial',
        name: 'Commercial',
        tag: 'Most chosen',
        description: 'Hosted by us or licensed to run yourself.',
        price: 'PRICE',
        unit: 'per UNIT',
        tone: 'violet',
        highlight: true,
        placeholder: true,
        action: 'Talk to us',
        path: '/pricing?section=contact',
        features: [
          'Everything in Core',
          'Per-tenant brand kit and custom domain',
          'Many tenants, with switching',
          'Audit streaming to your SIEM',
          'Single sign-on configuration',
          'Custom role authoring',
        ],
      },
      {
        id: 'white-label',
        name: 'White-label',
        tag: 'Resellers',
        description: 'Ship it as your own product.',
        price: 'CONTACT',
        tone: 'pink',
        placeholder: true,
        action: 'Ask about reselling',
        path: '/pricing?section=contact',
        note: 'Capabilities planned',
        features: [
          'No xwflow mark on any branded screen',
          'Your OAuth client on consent screens',
          'Embeddable studio with session handoff',
          'Template library and connector allow-list per tenant',
        ],
      },
    ],
    compare: {
      eyebrow: 'Compare',
      title: 'What each tier includes',
      description:
        'A gated control stays visible in the product. It is disabled and names the tier that unlocks it.',
      columns: [
        { key: 'capability', title: 'Capability' },
        { key: 'core', title: 'Core' },
        { key: 'commercial', title: 'Commercial' },
      ],
      rows: [
        'Studio canvas, palette, inspector, run view',
        'Executions and run receipts',
        'Credentials, values never shown',
        'Versions, publish requests, approvals, graph diff',
        'Audit view and download',
        'Built-in roles, alert routing, readiness checklist',
        'Tenants',
        'Per-tenant brand kit and custom domain',
        'Audit streaming to SIEM',
        'Single sign-on configuration',
        'Custom role authoring',
        'Paid template tiers',
      ].map((capability, i) => ({
        capability,
        core: i < 6 ? 'Included' : i === 6 ? 'One' : 'Requires Commercial',
        commercial: i === 6 ? 'Many, with switching' : 'Included',
      })),
    },
    contact: {
      heading: 'Tell us what',
      accent: 'you want to run.',
      description:
        'Team size, who hosts, and whether you plan to resell. We reply with a quote.',
      email: 'Work email',
      emailPlaceholder: 'you@company.com',
      notes: 'What do you want to run?',
      notesPlaceholder: 'For example: order alerts for 3 branches',
      action: 'Request a quote',
      sent: 'Quote request saved in this demo. No email was sent.',
      validation: 'Enter a valid work email and describe what you want to run.',
    },
    faqTitle: 'Licensing questions',
    faq: [
      {
        id: 'core',
        title: 'Can I self-host Core?',
        content: 'Yes. Core is self-hosted under Apache-2.0.',
      },
      {
        id: 'price',
        title: 'What does Commercial cost?',
        content:
          'The prototype leaves PRICE and UNIT unspecified. Request a quote to record your requirements in this demo.',
      },
      {
        id: 'brand',
        title: 'Can I ship it under my own brand?',
        content:
          'White-label capabilities are planned. The branding screen demonstrates a tenant brand kit.',
      },
    ],
  },

};
