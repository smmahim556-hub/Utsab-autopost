// One-off: TCB's new daily price page; logs its JSON API calls and the visible table. Writes state/market-probe.json.
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const out = { api: [] };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
  const pg = await ctx.newPage();
  pg.on('response', async r => { const ct = r.headers()['content-type'] || ''; if (/json/.test(ct)) { try { out.api.push({ url: r.url(), status: r.status(), body: (await r.text()).slice(0, 2500) }); } catch {} } });
  for (const u of ['https://tcb.gov.bd/pages/daily-rmps', 'https://tcb.gov.bd/pages/last30-rmps']) {
    try {
      await pg.goto(u, { timeout: 60000, waitUntil: 'networkidle' });
      await pg.waitForTimeout(4000);
      out[u] = { text: (await pg.evaluate(() => document.body.innerText)).slice(0, 4000),
        links: await pg.evaluate(() => [...document.querySelectorAll('a')].filter(a => /pdf|download|ডাউনলোড/i.test(a.href + a.textContent)).map(a => [a.textContent.trim().slice(0, 60), a.href]).slice(0, 10)) };
    } catch (e) { out[u] = e.message.slice(0, 200); }
  }
  await browser.close();
  fs.writeFileSync('state/market-probe.json', JSON.stringify(out, null, 2));
})();
