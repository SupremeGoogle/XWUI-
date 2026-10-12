/** Admin copy, seed records and mock rules. */
export const adminOverviewData = {
  overview: {
    title: 'Overview',
    description:
      'Each panel loads on its own. If one fails, the others stay readable and it says what went wrong.',
    kpis: [
      {
        title: 'Runs, 24 h',
        value: 12480,
        footnote: 'as of 12 s ago',
        tone: 'cyan',
      },
      {
        title: 'Failed, 24 h',
        value: 170,
        footnote: 'as of 12 s ago',
        tone: 'red',
      },
      {
        title: 'Overdue schedules',
        value: 0,
        footnote: 'as of 5 s ago',
        tone: 'lime',
      },
      {
        title: 'Queued by admission',
        value: 'not recorded',
        textValue: true,
        footnote: 'No admission port configured',
        tone: 'violet',
      },
    ],
    chart: {
      title: 'Runs by hour',
      succeeded: 'Succeeded',
      failed: 'Failed',
      period: 'last 24 hours',
      start: '24 hours ago',
      end: 'Now, last hour partial',
      ariaLabel:
        'Stacked bars of succeeded and failed runs for each of the last 24 hours, peaking at midday',
      hours: [
        60, 48, 40, 36, 34, 40, 56, 92, 130, 160, 178, 186, 172, 174, 180, 188,
        174, 160, 130, 104, 90, 80, 74, 66,
      ].map((succeeded, index) => ({
        hour: index,
        succeeded,
        failed: [
          2, 2, 1, 1, 2, 3, 4, 6, 8, 10, 12, 9, 7, 9, 14, 12, 10, 8, 6, 5, 4, 3,
          3, 2,
        ][index],
        partial: index === 23,
      })),
    },
    reachability: {
      title: 'Reachability',
      hint: 'per check',
      tiles: [
        { label: 'Engine', tone: 'green', x: 20, y: 20, z: 30 },
        { label: 'API', tone: 'cyan', x: 200, y: 20, z: 44 },
        { label: 'Identity', tone: 'violet', x: 20, y: 200, z: 20 },
        {
          label: 'Storage',
          tone: 'red',
          x: 200,
          y: 200,
          z: 8,
          attention: true,
        },
      ],
      noticeTitle: 'Storage seam',
      notice: 'No answer for 3 minutes. Engine, API and identity answer.',
      healthy: 'Engine, API, identity and storage answer.',
      action: 'Open system health',
      path: '/system/health',
    },
    failures: {
      title: 'Most failed runs, 24 h',
      hint: 'as of 12 s ago',
      columns: [
        { key: 'flow', title: 'Flow' },
        { key: 'tenant', title: 'Tenant' },
        { key: 'failed', title: 'Failed', align: 'end' },
        { key: 'share', title: 'Share of failures' },
        { key: 'cause', title: 'Most common cause' },
      ],
      rows: [
        {
          id: 'run_weekly_digest_014',
          flow: 'Weekly invoice digest',
          tenant: 'Personal workspace',
          failed: 96,
          share: 56,
          tone: 'red',
          cause: 'Credential sign-in expired',
          path: '/studio/runs/run_weekly_digest_014',
        },
        {
          id: 'run_order_alert_009',
          flow: 'Order alert',
          tenant: 'Personal workspace',
          failed: 51,
          share: 30,
          tone: 'orange',
          cause: 'Server answered 503',
          path: '/studio/runs/run_order_alert_009',
        },
        {
          id: 'run_lead_intake_007',
          flow: 'Lead intake',
          tenant: 'Personal workspace',
          failed: 23,
          share: 14,
          tone: 'amber',
          cause: 'Timed out',
          path: '/studio/runs/run_lead_intake_007',
        },
      ],
    },
  },

};
