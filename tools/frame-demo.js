// Demo of the shared brand frame: runs the card demos, then puts one of each side by side in preview/frame-demo.png. Posts nothing.
const { execSync } = require('child_process');
const fs = require('fs');
const run = env => { try { execSync('node autopost.js', { stdio: 'inherit', timeout: 6 * 60e3, env: { ...process.env, DRY_RUN: '1', ...env } }); } catch (e) { console.log('demo failed', env, e.message); } };
run({ DEMO_PRAYER: '1' }); run({ DEMO_SPORTS: '1' }); run({ DEMO_ENT: '1' }); run({ DEMO_MUN: '1' }); run({ DEMO_GM: '1' }); run({ DEMO_EXTRAS: '1', DEMO_EXTRAS_REEL: '0' });
const files = ['ent-demo-1.png', 'biz-demo-1.png', 'sports-demo-1.png', 'sports-demo-fixtures.png', 'prayer-demo-schedule.png', 'prayer-demo-reminder.png',
  'mun-demo-1.png', 'gm-demo.png', 'extra-top5.png', 'extra-market.png', 'extra-otd.png', 'extra-poll.png'].filter(f => fs.existsSync(`preview/${f}`));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 4 * 540 + 50, height: 3 * 675 + 40 } });
  await pg.setContent(`<body style="margin:0;background:#fff;display:grid;grid-template-columns:repeat(4,540px);gap:10px;padding:10px">${files.map(f =>
    `<img src="data:image/png;base64,${fs.readFileSync(`preview/${f}`).toString('base64')}" style="width:540px;height:675px">`).join('')}</body>`);
  await pg.screenshot({ path: 'preview/frame-demo.png', fullPage: true });
  await b.close();
})();
