import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.2, colorScheme: 'dark' });
const routes = {
  home: '/', integrations: '/integrations', assistant: '/studio', flows: '/studio/flows',
  editor: '/studio/flows/flow_order_alert', runs: '/studio/runs', run: '/studio/runs/run_order',
  connections: '/studio/connections', admin: '/admin', branding: '/admin/branding', audit: '/admin/audit',
  health: '/system/health', selfhost: '/self-host', notations: '/notations',
  v_flowchart: '/studio/flows/flow_order_alert/view/flowchart', v_swimlanes: '/studio/flows/flow_order_alert/view/swimlanes',
  v_bpmn: '/studio/flows/flow_order_alert/view/bpmn', v_sequence: '/studio/flows/flow_order_alert/view/sequence',
  v_simulation: '/studio/flows/flow_order_alert/view/simulation', v_3d: '/studio/flows/flow_order_alert/view/3d',
};
for (const [k, r] of Object.entries(routes)) {
  try {
    await p.goto(`http://localhost:8080/?mock=fast#${r}`, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${k}.png` });
    console.log('ok', k);
  } catch (e) { console.log('fail', k, e.message.slice(0, 80)); }
}
await b.close();
