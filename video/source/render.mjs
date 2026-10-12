import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,, outDir, a, b, fps = '30', list] = process.argv;
const br = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto('file://' + process.cwd() + '/comp/index.html');
await p.evaluate(() => window.ready); await p.waitForTimeout(800);
const times = list ? list.split(',').map(Number) : null;
const start = Math.round(+a * +fps), end = Math.round(+b * +fps);
const N = times ? times.length : end - start;
for (let i = 0; i < N; i++) {
  const idx = times ? i : start + i;
  const t = times ? times[i] : idx / +fps;
  await p.evaluate(async t => { window.render(t); await window.flush(); }, t);
  await p.screenshot({ path: `${outDir}/f${String(idx).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
}
await br.close();
