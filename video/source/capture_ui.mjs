import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out = process.argv[2];
fs.mkdirSync(`${out}/ui`, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, colorScheme: 'dark' });
await p.route('**/editor.page.js', async (route) => {
  const r = await route.fetch(); const body = (await r.text()).replace('canvas.focusNode(result.id);', '');
  await route.fulfill({ response: r, body });
});
const meta = { assistant: {}, editor: { steps: [] } };
const shot = async (name) => p.screenshot({ path: `${out}/ui/${name}.jpg`, type: 'jpeg', quality: 90 });
const box = async (loc) => { const r = await loc.boundingBox(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };

/* ---------- assistant: type inside the real prompt field ---------- */
await p.goto('http://localhost:8080/?mock=fast#/studio', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const ta = p.locator('.assistant-textarea textarea').first();
meta.assistant.box = await box(ta);
await ta.click(); await p.waitForTimeout(300);
await p.mouse.move(1590, 990);
const text = 'Alert sales when an order is over $500';
await shot('a00');
for (let i = 1; i <= text.length; i++) { await ta.type(text[i - 1]); await shot(`a${String(i).padStart(2, '0')}`); }
meta.assistant.n = text.length;
await p.keyboard.press('Enter');
await p.waitForTimeout(2500);
await shot('a_done');

/* ---------- editor: drop two steps, connect three ---------- */
const id = await p.evaluate(async () => {
  const { api } = await import('/src/api/index.js');
  const r = await api.studioApi.createFlow({ name: 'Order alert' });
  return r.id;
});
await p.goto(`http://localhost:8080/?mock=fast#/studio/flows/${id}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
await p.mouse.move(1590, 990);
const canvas = p.locator('.xwf-flow-canvas').first();
meta.editor.canvas = await box(canvas);
let k = 0;
const step = async (cursor, extra = {}) => { const name = `e${String(k++).padStart(3, '0')}`; await shot(name); meta.editor.steps.push({ name, cursor, ...extra }); };
const nodeBox = async (label) => box(p.locator('[data-node-id]', { hasText: label }).first());
let wh = await nodeBox('Webhook');
await p.mouse.click(wh.x + wh.w / 2, wh.y + wh.h / 2); await p.waitForTimeout(600);
wh = await nodeBox('Webhook');
// pan so the webhook sits at the left of the canvas (not recorded)
const from = { x: 1000, y: 560 };
await p.mouse.move(from.x, from.y); await p.mouse.down();
await p.mouse.move(from.x + (360 - (wh.x + wh.w / 2)) / 2, from.y + (450 - (wh.y + wh.h / 2)) / 2, { steps: 5 });
await p.mouse.move(from.x + 360 - (wh.x + wh.w / 2), from.y + 450 - (wh.y + wh.h / 2), { steps: 5 });
await p.mouse.up(); await p.mouse.move(1590, 990); await p.waitForTimeout(500);
wh = await nodeBox('Webhook');
await step(null);
const drops = [['HTTP request', 'http_request', { x: wh.x + wh.w / 2 + 290, y: wh.y + wh.h / 2 + 4 }], ['AI condition', 'ai_condition', { x: wh.x + wh.w / 2 + 580, y: wh.y + wh.h / 2 + 4 }]];
for (const [label, type, at] of drops) {
  const it = await box(p.locator('.editor-palette__item', { hasText: label }).first());
  meta.editor.steps.push({ name: 'drag', from: { x: it.x + it.w / 2, y: it.y + it.h / 2 }, to: at, label, type });
  await p.evaluate(({ type, at }) => {
    const root = document.querySelector('.xwf-flow-canvas');
    const dt = new DataTransfer(); dt.setData('application/x-xwflow-step', type);
    root.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, clientX: at.x, clientY: at.y, bubbles: true, cancelable: true }));
  }, { type, at });
  await p.waitForTimeout(900);
  await step(at, { dropped: label });
}
// connect: drag from each node's output pin onto the next node
const pairs = [['Webhook', 'HTTP request'], ['HTTP request', 'AI condition']];
for (const [a, bLabel] of pairs) {
  const pin = await box(p.locator('[data-node-id]', { hasText: a }).first().locator('xpath=..').locator('.xwf-node__out').first()).catch(() => null);
  const pinLoc = pin ? null : null;
  const src = await p.evaluate((a) => {
    const n = [...document.querySelectorAll('[data-node-id]')].find((e) => e.textContent.includes(a));
    const pinEl = document.querySelector(`.xwf-node__out[data-node-id="${n.dataset.nodeId}"]`);
    const r = pinEl.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, a);
  const dst = await nodeBox(bLabel);
  const tgt = { x: dst.x + dst.w * 0.35, y: dst.y + dst.h / 2 };
  await p.mouse.move(src.x, src.y); await step(src, { phase: 'hover' });
  await p.mouse.down(); await step(src, { phase: 'down' });
  const N = 18;
  for (let i = 1; i <= N; i++) {
    const e = i / N, q = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
    const c = { x: src.x + (tgt.x - src.x) * q, y: src.y + (tgt.y - src.y) * q - Math.sin(Math.PI * e) * 30 };
    await p.mouse.move(c.x, c.y); await step(c, { phase: 'wire' });
  }
  await p.mouse.up(); await p.waitForTimeout(400); await step(tgt, { phase: 'up' });
}
await p.keyboard.press('Escape'); await p.mouse.move(1590, 990); await p.waitForTimeout(500);
await step(null, { phase: 'final' });
fs.writeFileSync(`${out}/ui/meta.json`, JSON.stringify(meta, null, 1));
console.log(JSON.stringify({ a: meta.assistant.box, canvas: meta.editor.canvas, steps: meta.editor.steps.length }));
await b.close();
